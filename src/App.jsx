// ── YOLA Code — App (el editor nativo de YOLA) ───────────────
// Mejor que Cursor/Codex/Antigravity: vive en un OS cuyo kernel es
// el agente. Workspace real (api.os.files), tabs, syntax
// highlighting, paleta de comandos, búsqueda y agente integrado.
// Compilada con Vite → dist/app.js (bundle autocontenido).
// ──────────────────────────────────────────────────────────────
import { createSignal, createMemo, For, Show, onCleanup, onMount } from 'solid-js'
import { hasFilesApi, buildYolaFilesApi, loadLocalFiles, saveLocalFiles, loadWorkspacePath, saveWorkspacePath } from './api'
import { detectLanguage } from './editor/highlight'
import { MonacoEditor as Editor } from './editor/MonacoEditor'
import { Explorer } from './editor/Explorer'
import { Palette } from './editor/Palette'
import { WorkspaceSearch } from './editor/WorkspaceSearch'
import { AgentPanel } from './agent/AgentPanel'
import { XtermPanel as TerminalPanel } from './terminal/XtermPanel'
import { TemplatesPanel } from './templates/TemplatesPanel'
import { generateTemplate } from './templates/index'
import { loadLocalWorkspaces, saveLocalWorkspaces, fetchOsWorkspaces, mergeWorkspaces, workspaceLabel } from './workspaces'

export function createApp(api) {
  return function YolaCodeWindow() {
    const hasFiles = hasFilesApi(api)
    // filesApi PROPIO con el contrato real del daemon — YolaCode no
    // depende del filesApi del anfitrión (el del OS usa /files/list,
    // ruta inexistente → 404 sin ACAO → "CORS blocked" engañoso)
    const filesApi = hasFiles ? buildYolaFilesApi(api.os.daemonUrl) : null

    const [workspace, setWorkspace] = createSignal(loadWorkspacePath())
    const [tabs, setTabs] = createSignal([]) // {path, name, lang, content, dirty, local}
    const [activeIdx, setActiveIdx] = createSignal(-1)
    const [palette, setPalette] = createSignal(false)
    const [paletteMode, setPaletteMode] = createSignal('commands')
    const [paletteFiles, setPaletteFiles] = createSignal([])
    const [searchOpen, setSearchOpen] = createSignal(false)
    const [searchQuery, setSearchQuery] = createSignal('')
    const [searchIdx, setSearchIdx] = createSignal(0)
    const [status, setStatus] = createSignal('')
    const [manifestOpen, setManifestOpen] = createSignal(false)
    const [manifestText, setManifestText] = createSignal('')
    const [wsSearch, setWsSearch] = createSignal(false)
    const [wsQuery, setWsQuery] = createSignal('')
    const [cursor, setCursor] = createSignal(null) // {line, col}
    const [hasSelection, setHasSelection] = createSignal(false)
    const [helpOpen, setHelpOpen] = createSignal(false)
    const [agentOpen, setAgentOpen] = createSignal(false)
    const [agentPrefill, setAgentPrefill] = createSignal('')
    const [recent, setRecent] = createSignal([]) // [{path, name}] aperturas recientes
    const [knownWs, setKnownWs] = createSignal([]) // workspaces (OS + locales, persistidos)
    const [wsMenu, setWsMenu] = createSignal(false)
    const [terminalOpen, setTerminalOpen] = createSignal(false)
    const [templateOpen, setTemplateOpen] = createSignal(false)
    let taRef = null
    let saveTimer = null
    let rootRef = null

    // El foco vive en el root (tabIndex=0): los atajos funcionan aunque el
    // usuario haga clic en áreas vacías. Al interactuar con controles, el
    // foco se queda en ellos; al hacer clic en el fondo, vuelve al root.
    function onRootMouseDown(e) {
      const tag = e.target?.tagName
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'BUTTON' && tag !== 'SELECT' && tag !== 'A') {
        rootRef?.focus()
      }
    }

    // Al cerrar cualquier overlay, el foco vuelve al editor (nunca se queda
    // huérfano — "cosa estúpida" que el usuario nota al instante)
    function focusEditor() {
      taRef?.focus()
    }

    const active = createMemo(() => tabs()[activeIdx()] || null)

    const searchMatches = createMemo(() => {
      const q = searchQuery().toLowerCase().trim()
      const c = active()?.content || ''
      if (!q) return []
      const out = []
      let i = c.toLowerCase().indexOf(q)
      while (i !== -1) {
        out.push(i)
        i = c.toLowerCase().indexOf(q, i + q.length)
      }
      return out
    })

    onMount(() => {
      syncWorkspaces()
    })

    onCleanup(() => {
      if (saveTimer) clearTimeout(saveTimer)
      persistLocal()
    })

    function flash(msg) {
      setStatus(msg)
      setTimeout(() => setStatus(''), 2500)
    }

    // Errores SIEMPRE visibles: flash en el header (funciona en el OS y
    // en el .exe — donde api.os.notify es console.log, invisible)
    function notifyError(msg) {
      flash(`⛔ ${msg}`)
      try { api.os.notify?.(msg, 'error', 3500) } catch { /* noop */ }
    }

    // ── Persistencia local (fallback sin daemon) ──
    function persistLocal() {
      const local = tabs().filter(t => t.local)
      if (local.length) {
        const map = {}
        for (const t of local) map[t.path] = t.content
        saveLocalFiles(map)
      }
    }

    // ── Workspaces: los del OS se detectan solos y se persisten (para el .exe) ──
    async function syncWorkspaces() {
      const locals = loadLocalWorkspaces()
      let merged = locals
      if (hasFiles && api?.os?.daemonUrl) {
        try {
          const osWs = await fetchOsWorkspaces(api.os.daemonUrl)
          const res = mergeWorkspaces(osWs, locals)
          merged = res.merged
          if (res.added) flash(`📂 ${res.added} workspace${res.added > 1 ? 's' : ''} del OS detectado${res.added > 1 ? 's' : ''}`)
        } catch { /* sin daemon: solo locales */ }
      }
      setKnownWs(merged)
      saveLocalWorkspaces(merged)
    }

    function pickWorkspace(root) {
      // cambiar de workspace cierra los archivos abiertos (como VS Code)
      const dirty = tabs().find(t => t.dirty)
      if (dirty && !confirm('Cambiar de workspace cerrará los archivos abiertos. ¿Continuar?')) {
        setWsMenu(false)
        return
      }
      setTabs([])
      setActiveIdx(-1)
      setWorkspace(root)
      saveWorkspacePath(root)
      setWsMenu(false)
      flash('☰ Workspace: ' + root)
    }

    // ── Workspace ──
    function openWorkspace() {
      const p = prompt('Ruta del workspace (carpeta en tu máquina):', workspace() || '')
      if (p === null) return
      setWorkspace(p.trim())
      saveWorkspacePath(p.trim())
      flash('☰ Workspace: ' + (p.trim() || 'sin workspace'))
    }

    // ── Tabs ──
    async function openFile(path, name, line) {
      const existing = tabs().findIndex(t => t.path === path)
      if (existing !== -1) {
        setActiveIdx(existing)
        if (line) focusLine(line)
        return
      }
      try {
        const content = await filesApi.read(path)
        addTab({ path, name: name || path.split('/').pop() || path, lang: detectLanguage(name || path), content, dirty: false, local: false })
        setRecent(prev => [{ path, name: name || path.split('/').pop() || path }, ...prev.filter(r => r.path !== path)].slice(0, 8))
        if (line) setTimeout(() => focusLine(line), 50)
      } catch (e) {
        api.os.notify?.(`No se pudo abrir: ${e.message}`)
      }
    }

    function focusLine(line) {
      if (!taRef) return
      const t = active()
      if (!t) return
      const idx = t.content.split('\n').slice(0, line - 1).join('\n').length
      const end = idx + (t.content.split('\n')[line - 1]?.length || 0)
      taRef.focus()
      taRef.setSelectionRange(idx, end)
    }

    function openLocal(name) {
      const content = loadLocalFiles()[name] || ''
      addTab({ path: name, name, lang: detectLanguage(name), content, dirty: false, local: true })
    }

    function addTab(tab) {
      // computar el array nuevo ANTES de los sets (Solid batcha dentro de
      // handlers: leer tabs() después de setTabs daría el valor viejo)
      const next = [...tabs(), tab]
      setTabs(next)
      setActiveIdx(next.length - 1) // el nuevo tab es el último
    }

    function closeTab(i) {
      const t = tabs()[i]
      if (t?.dirty && !confirm(`«${t.name}» tiene cambios sin guardar. ¿Cerrar de todas formas?`)) return
      setTabs(prev => prev.filter((_, idx) => idx !== i))
      if (activeIdx() === i) {
        const next = tabs().length - 1
        setActiveIdx(i > 0 ? Math.min(i - 1, next - 1) : (next > 0 ? 0 : -1))
      } else if (activeIdx() > i) {
        setActiveIdx(activeIdx() - 1)
      }
    }

    function updateActive(content) {
      const i = activeIdx()
      if (i === -1) return
      const t = tabs()[i]
      setTabs(prev => prev.map((x, idx) => idx === i ? { ...x, content, dirty: true } : x))
      if (saveTimer) clearTimeout(saveTimer)
      // Guardado honesto: los tabs del workspace NO se autoguardan (Ctrl+S)
      saveTimer = setTimeout(() => {
        if (t.local) { persistLocal(); flash('● Guardando…') }
        // workspace: el dot ● del tab ya avisa de cambios sin guardar
      }, 800)
    }

    async function saveTab() {
      const t = active()
      if (!t) return
      if (t.local) {
        persistLocal()
        setTabs(prev => prev.map((x, i) => i === activeIdx() ? { ...x, dirty: false } : x))
        flash('✓ Guardado')
        return
      }
      try {
        await filesApi.write(t.path, t.content)
        setTabs(prev => prev.map((x, i) => i === activeIdx() ? { ...x, dirty: false } : x))
        flash('✓ Guardado en disco')
      } catch (e) {
        notifyError(`Error al guardar: ${e.message}`)
      }
    }

    async function newFile() {
      const name = prompt('Nuevo archivo (ruta relativa al workspace):', 'nuevo.md')
      if (!name) return
      if (!hasFiles) {
        openLocal(name)
        return
      }
      const path = workspace() ? `${workspace().replace(/\/+$/, '')}/${name}` : name
      try {
        await filesApi.create(path, 'file')
        await openFile(path, name)
        flash(`➕ ${name}`)
      } catch (e) {
        notifyError(`Error: ${e.message}`)
      }
    }

    // ── Acciones del Explorer ──
    const [refresh, setRefresh] = createSignal(0)

    function parentDirOf(item) {
      // carpeta → dentro de ella; archivo → su mismo directorio
      if (item.type === 'dir') return item.path
      const parts = item.path.split('/')
      parts.pop()
      return parts.join('/')
    }

    function absPath(rel) {
      return workspace() ? `${workspace().replace(/\/+$/, '')}/${rel.replace(/^\/+/, '')}` : rel
    }

    async function newFileIn(item) {
      if (!workspace()) { flash('Abre un workspace primero'); return }
      const base = parentDirOf(item)
      const name = prompt('Nuevo archivo:', 'nuevo.md')
      if (!name) return
      const rel = base ? `${base}/${name}` : name
      try {
        await filesApi.create(absPath(rel), 'file')
        setRefresh(r => r + 1)
        await openFile(absPath(rel), name)
        flash(`➕ ${name}`)
      } catch (e) {
        notifyError(`Error: ${e.message}`)
      }
    }

    async function newFolder(item) {
      if (!workspace()) { flash('Abre un workspace primero'); return }
      const base = parentDirOf(item)
      const name = prompt('Nueva carpeta:', 'nueva-carpeta')
      if (!name) return
      const rel = base ? `${base}/${name}` : name
      try {
        await filesApi.create(absPath(rel), 'dir')
        setRefresh(r => r + 1)
        flash(`📁 ${name}`)
      } catch (e) {
        notifyError(`Error: ${e.message}`)
      }
    }

    // Mueve una carpeta de forma RECURSIVA (la API no tiene rename:
    // read→create→write→remove por entrada, con subcarpetas completas)
    async function moveDirRecursive(oldRel, newRel, oldAbs, newAbs) {
      const entries = await filesApi.list(workspace(), oldRel)
      for (const e of entries) {
        const oRel = `${oldRel}/${e.name}`
        const nRel = `${newRel}/${e.name}`
        const oAbs = `${oldAbs}/${e.name}`
        const nAbs = `${newAbs}/${e.name}`
        if (e.type === 'dir') {
          await filesApi.create(nAbs, 'dir')
          await moveDirRecursive(oRel, nRel, oAbs, nAbs)
          await filesApi.remove(oAbs)
        } else {
          await filesApi.create(nAbs, 'file')
          await filesApi.write(nAbs, await filesApi.read(oAbs))
          await filesApi.remove(oAbs)
        }
      }
    }

    async function renameItem(item) {
      const parts = item.path.split('/')
      const oldName = parts[parts.length - 1]
      const name = prompt('Nuevo nombre:', oldName)
      if (!name || name === oldName) return
      const oldRel = item.path
      const newRel = [...parts.slice(0, -1), name].join('/')
      const oldAbs = item.absolute || absPath(oldRel)
      const newAbs = absPath(newRel)
      try {
        if (item.type === 'file') {
          const content = await filesApi.read(oldAbs)
          await filesApi.create(newAbs, 'file')
          await filesApi.write(newAbs, content)
          await filesApi.remove(oldAbs)
          // actualizar tabs que referenciaban el path viejo
          setTabs(prev => prev.map(t => t.path === oldAbs ? { ...t, path: newAbs, name } : t))
        } else {
          await filesApi.create(newAbs, 'dir')
          await moveDirRecursive(oldRel, newRel, oldAbs, newAbs)
          await filesApi.remove(oldAbs)
          // tabs abiertos dentro de la carpeta renombrada
          setTabs(prev => prev.map(t => t.path.startsWith(oldAbs) ? { ...t, path: newAbs + t.path.slice(oldAbs.length) } : t))
        }
        setRefresh(r => r + 1)
        flash(`✏ï¸ ${oldName} → ${name}`)
      } catch (e) {
        notifyError(`Error al renombrar: ${e.message}`)
      }
    }

    async function deleteItem(item) {
      const confirmed = confirm(`¿Eliminar «${item.name}»${item.type === 'dir' ? ' y todo su contenido' : ''}?`)
      if (!confirmed) return
      const abs = item.absolute || absPath(item.path)
      try {
        await filesApi.remove(abs)
        // cerrar tabs de ese archivo (o de archivos dentro de la carpeta)
        setTabs(prev => prev.filter(t => !t.path.startsWith(abs)))
        setRefresh(r => r + 1)
        flash(`🗑ï¸ ${item.name}`)
      } catch (e) {
        notifyError(`Error al eliminar: ${e.message}`)
      }
    }

    // ── Agente ──
    // 💬 = toggle del panel (abre y cierra) · ✨ = mejorar la selección
    function askYola(withSelection) {
      if (!withSelection && agentOpen()) {
        // 💬 con el panel abierto → ocultarlo (toggle simétrico)
        setAgentOpen(false)
        taRef?.focus()
        return
      }
      setAgentOpen(true)
      if (withSelection && taRef && taRef.selectionStart !== taRef.selectionEnd) {
        const t = active()
        if (t) setAgentPrefill(t.content.slice(taRef.selectionStart, taRef.selectionEnd))
      }
    }

    // Aplica el cambio propuesto por el agente. `capturedSel` es la
    // selección capturada cuando el usuario pulsó "Aplicar" (el editor
    // pudo cambiar desde entonces — aplicar SIEMPRE contra lo capturado).
    // Sin selección → reemplazo TOTAL (el diálogo lo advierte explícito).
    async function applyToActive(proposed, capturedSel) {
      const t = active()
      if (!t) return
      const prevContent = t.content
      const sel = capturedSel || (taRef ? { s: taRef.selectionStart, e: taRef.selectionEnd } : null)
      const nextContent = sel && sel.s !== sel.e
        ? prevContent.slice(0, sel.s) + proposed + prevContent.slice(sel.e)
        : proposed
      if (!t.local) {
        try {
          await filesApi.write(t.path, nextContent)
          setTabs(prev => prev.map((x, i) => i === activeIdx() ? { ...x, content: nextContent, dirty: false } : x))
          flash('✨ Cambio aplicado en disco')
        } catch (e) {
          // rollback: si el write falla, el contenido del editor NO cambia
          setTabs(prev => prev.map((x, i) => i === activeIdx() ? { ...x, content: prevContent, dirty: true } : x))
          notifyError(`Error al guardar: ${e.message}`)
        }
      } else {
        setTabs(prev => prev.map((x, i) => i === activeIdx() ? { ...x, content: nextContent, dirty: false } : x))
        flash('✨ Cambio aplicado')
      }
    }

    // ── Manifest ──
    function openManifest() {
      try {
        const apps = api.os.getApps ? api.os.getApps() : []
        const self = apps.find(a => a.id === 'yola-code')
        setManifestText(JSON.stringify(self?.manifest || { id: 'yola-code' }, null, 2))
        setManifestOpen(true)
      } catch (e) {
        notifyError(`Error: ${e.message}`)
      }
    }

    // ── Templates ──
    function openTemplates() {
      setTemplateOpen(true)
      setPalette(false)
    }

    async function handleGenerateTemplate(files, tpl) {
      // Crear archivos del template en el workspace actual o local
      for (const f of files) {
        if (hasFiles && filesApi && workspace()) {
          // Workspace real: escribir en disco vía daemon
          const fullPath = f.path.includes('/') ? f.path : f.path
          try {
            await filesApi.write(workspace(), fullPath, f.content)
          } catch (e) {
            notifyError(`Error creando ${fullPath}: ${e.message}`)
            return
          }
        } else {
          // Modo local: guardar en localStorage
          const allFiles = loadLocalFiles()
          allFiles[f.path] = f.content
          saveLocalFiles(allFiles)
        }
      }

      // Abrir el archivo principal
      const mainFile = files.find(f => f.path === 'src/App.jsx' || f.path === 'agent.js' || f.path === 'pipeline.js')
      if (mainFile) {
        if (hasFiles && workspace()) {
          const wsPath = workspace().replace(/\\/g, '/').replace(/\/$/, '')
          const fullPath = `${wsPath}/${mainFile.path}`
          openFile(fullPath, mainFile.path.split('/').pop())
        } else {
          openLocal(mainFile.path)
        }
      }

      setStatus(`✅ Proyecto "${tpl.name}" creado (${files.length} archivos)`)
      setTemplateOpen(false)
    }

    // ── Búsqueda en archivo ──
    function nextMatch(dir = 1) {
      const m = searchMatches()
      if (!m.length) return
      setSearchIdx(i => (i + dir + m.length) % m.length)
      const pos = searchMatches()[searchIdx()]
      const q = searchQuery()
      if (taRef && pos !== undefined) {
        taRef.focus()
        taRef.setSelectionRange(pos, pos + q.length)
      }
    }

    // ── Paleta: archivos (Ctrl+P) / comandos (Ctrl+Shift+P) ──
    async function collectFiles() {
      if (!hasFiles || !workspace()) { setPaletteFiles([]); return }
      const out = []
      const walk = async (dir, depth) => {
        if (depth > 5) return
        let entries
        try { entries = await filesApi.list(workspace(), dir === '/' ? '' : dir) } catch { return }
        for (const it of entries) {
          if (it.type === 'dir') await walk(it.path, depth + 1)
          else out.push({ path: it.absolute || it.path, name: it.name })
        }
      }
      try { await walk('/', 0) } catch { /* workspace inaccesible */ }
      setPaletteFiles(out.slice(0, 500))
    }

    function openPalette(mode) {
      // toggle simétrico: mismo modo abierto → cerrar; otro modo → cambiar
      if (palette() && paletteMode() === mode) {
        setPalette(false)
        taRef?.focus()
        return
      }
      setPaletteMode(mode)
      setPalette(true)
      if (mode === 'files') collectFiles()
    }

    // ── Comandos ──
    const commands = () => [
      { id: 'open-ws', label: 'Abrir workspace…', icon: '☰', run: openWorkspace },
      { id: 'new', label: 'Nuevo archivo…', icon: '➕', run: newFile },
      { id: 'template', label: 'Nuevo desde template…', icon: '📋', run: openTemplates },
      { id: 'save', label: 'Guardar (Ctrl+S)', icon: '💾', run: saveTab },
      { id: 'find', label: 'Buscar en archivo (Ctrl+F)', icon: '🔍', run: () => { setSearchOpen(true); setSearchQuery(''); setSearchIdx(0) } },
      { id: 'ws-find', label: 'Buscar en workspace (Ctrl+Shift+F)', icon: '🔎', run: () => { setWsSearch(true); setWsQuery('') } },
      { id: 'rename-active', label: 'Renombrar archivo activo…', icon: '✏ï¸', run: () => { const t = active(); if (t && !t.local) renameItem({ path: t.path.replace(workspace() + '/', ''), name: t.name, type: 'file', absolute: t.path }) } },
      { id: 'delete-active', label: 'Eliminar archivo activo…', icon: '🗑ï¸', run: () => { const t = active(); if (t && !t.local) deleteItem({ path: t.path.replace(workspace() + '/', ''), name: t.name, type: 'file', absolute: t.path }) } },
      { id: 'ask', label: 'Preguntar a YOLA', icon: '💬', run: () => askYola(false) },
      { id: 'improve', label: 'Mejorar selección con YOLA', icon: '✨', run: () => askYola(true) },
      { id: 'help', label: 'Atajos de teclado (F1)', icon: '❓', run: () => setHelpOpen(true) },
      { id: 'manifest', label: 'Ver manifest', icon: '📜', run: openManifest },
      ...(recent().length ? recent().map(r => ({ id: 'recent-' + r.path, label: `🕘 ${r.name}`, icon: '🕘', run: () => openFile(r.path, r.name) })) : []),
      ...(hasFiles ? [] : [{ id: 'local', label: 'Modo local: abre archivo demo…', icon: '📦', run: () => openLocal('README.md') }]),
    ]

    function onKeyDown(e) {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.shiftKey && (e.key === 'P' || e.key === 'p')) { e.preventDefault(); openPalette('commands'); return }
      if (mod && !e.shiftKey && e.key === 'p') { e.preventDefault(); openPalette('files'); return }
      if (mod && e.key === 'f') { e.preventDefault(); setSearchOpen(v => !v); setSearchIdx(0); return }
      if (mod && e.key === 'j') { e.preventDefault(); setAgentOpen(v => !v); return }
      if (mod && e.key === '`') { e.preventDefault(); setTerminalOpen(v => !v); return }
      if (mod && e.key === 'w') { e.preventDefault(); if (activeIdx() !== -1) closeTab(activeIdx()); return }
      if (mod && e.key === 'Tab') {
        // Ctrl+Tab: ciclar tabs (solo si hay más de uno)
        e.preventDefault()
        const n = tabs().length
        if (n > 1) setActiveIdx(i => (e.shiftKey ? (i - 1 + n) % n : (i + 1) % n))
        return
      }
      if (mod && e.shiftKey && (e.key === 'F' || e.key === 'f')) { e.preventDefault(); setWsSearch(v => !v); setWsQuery(''); return }
      if (e.key === 'F1') { e.preventDefault(); setHelpOpen(v => !v); return }
      if (e.key === 'Escape') {
        if (palette()) { setPalette(false); focusEditor() }
        else if (searchOpen()) { setSearchOpen(false); focusEditor() }
        else if (manifestOpen()) { setManifestOpen(false); focusEditor() }
        else if (wsSearch()) { setWsSearch(false); focusEditor() }
        else if (helpOpen()) { setHelpOpen(false); focusEditor() }
      }
    }

    const btnStyle = {
      padding: '4px 10px', border: '1px solid var(--border-window)', 'border-radius': '5px',
      background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
      'font-size': '11px', 'font-family': 'var(--font)', 'min-height': '26px',
    }
    const btnAccent = { ...btnStyle, border: '1px solid var(--accent)', color: 'var(--accent)' }

    return (
      <div
        ref={rootRef}
        tabIndex={0}
        onMouseDown={onRootMouseDown}
        style={{
          display: 'flex', 'flex-direction': 'column', height: '100%',
          background: 'var(--bg-window)', color: 'var(--text-primary)',
          'font-family': 'var(--font)', 'font-size': '13px', position: 'relative',
          outline: 'none',
        }}
        onKeyDown={onKeyDown}
      >
        <style>{`
          .yola-input:focus { outline: 2px solid color-mix(in srgb, var(--accent) 55%, transparent) !important; outline-offset: -1px; }
          .yola-btn:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
          .yola-btn:active { transform: translateY(1px); }
        `}</style>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', 'align-items': 'center', gap: '8px', padding: '5px 10px',
          'border-bottom': '1px solid var(--border-window)', 'flex-shrink': 0, 'flex-wrap': 'wrap',
        }}>
          <span style={{ 'font-size': '15px' }}>🧑‍💻</span>
          <span style={{ 'font-weight': 600 }}>YOLA Code</span>
          <span style={{
            'font-size': '9.5px', padding: '1px 7px', 'border-radius': '8px',
            background: hasFiles ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--warning) 15%, transparent)',
            color: hasFiles ? 'var(--success)' : 'var(--warning)',
          }}>{hasFiles ? 'workspace real' : 'modo local'}</span>
          <span style={{ 'font-size': '10.5px', color: 'var(--text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'max-width': '260px' }} title={workspace()}>
            {workspace() || 'sin workspace'}
          </span>
          <Show when={knownWs().length}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setWsMenu(v => !v)}
                className="yola-btn"
                style={btnStyle}
                title="Cambiar de workspace (detectados del OS + locales)"
                aria-label="Cambiar de workspace"
              >📂 {knownWs().length}</button>
              <Show when={wsMenu()}>
                <div style={{ position: 'fixed', inset: '0', zIndex: '45' }} onClick={() => setWsMenu(false)} />
                <div style={{
                  position: 'absolute', top: '100%', right: '0', zIndex: '46', 'margin-top': '4px',
                  background: 'var(--bg-window)', border: '1px solid var(--border-window)',
                  'border-radius': '8px', 'box-shadow': 'var(--shadow)', padding: '4px',
                  'min-width': '240px', 'max-width': '320px', 'max-height': '280px', overflow: 'auto',
                  'font-size': '11px', 'font-family': 'var(--font)',
                }}>
                  <div style={{ padding: '4px 8px', 'font-size': '9.5px', color: 'var(--text-muted)', 'text-transform': 'uppercase', 'letter-spacing': '0.4px' }}>
                    Workspaces ({knownWs().length})
                  </div>
                  <For each={knownWs()}>
                    {(w) => (
                      <div
                        onClick={() => pickWorkspace(w.root)}
                        style={{
                          padding: '6px 8px', 'border-radius': '5px', cursor: 'pointer',
                          display: 'flex', gap: '7px', 'align-items': 'center',
                          color: workspace() === w.root ? 'var(--accent)' : 'var(--text-primary)',
                          background: workspace() === w.root ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                        }}
                      >
                        <span>📁</span>
                        <span style={{ overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>{workspaceLabel(w)}</span>
                        <span style={{ 'margin-left': 'auto', 'font-size': '9px', color: 'var(--text-muted)', 'flex-shrink': 0 }}>
                          {w.source === 'os' ? 'OS' : 'local'}
                        </span>
                      </div>
                    )}
                  </For>
                  <div style={{ padding: '3px', 'border-top': '1px solid var(--border-window)', 'margin-top': '4px' }}>
                    <div
                      onClick={() => { setWsMenu(false); openWorkspace() }}
                      style={{ padding: '6px 8px', 'border-radius': '5px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >☰ Abrir otra ruta…</div>
                  </div>
                </div>
              </Show>
            </div>
          </Show>
          <div style={{ flex: 1 }} />
          <Show when={status()}>
            <span style={{ 'font-size': '10.5px', color: 'var(--text-secondary)' }}>{status()}</span>
          </Show>
          <button onClick={() => openPalette('commands')} style={btnAccent} className="yola-btn" title="Paleta de comandos (Ctrl+Shift+P)" aria-label="Paleta de comandos">☰</button>
          <button onClick={() => askYola(false)} style={btnStyle} className="yola-btn" title="Conversar con YOLA (Ctrl+J)" aria-label="Conversar con YOLA">💬</button>
          <button
            onClick={() => askYola(true)}
            disabled={!hasSelection()}
            style={{
              ...btnAccent,
              opacity: hasSelection() ? 1 : 0.4,
              cursor: hasSelection() ? 'pointer' : 'not-allowed',
            }}
            title={hasSelection() ? 'Mejorar la selección con YOLA' : 'Selecciona código para mejorarlo'}
            aria-label="Mejorar selección con YOLA"
          >✨</button>
          <button onClick={openManifest} style={btnStyle} className="yola-btn" title="Ver manifest" aria-label="Ver manifest">📜</button>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar: explorador o local */}
          <div style={{
            width: '190px', 'flex-shrink': 0, 'border-right': '1px solid var(--border-window)',
            background: 'var(--bg-window-header)', display: 'flex', 'flex-direction': 'column',
          }}>
            {hasFiles ? (
              <Explorer
                filesApi={filesApi}
                workspace={workspace()}
                refresh={refresh()}
                onOpenFile={(p) => openFile(p, p.split('/').pop())}
                onAction={(action, item) => {
                  if (action === 'new-file') newFileIn(item)
                  else if (action === 'new-folder') newFolder(item)
                  else if (action === 'rename') renameItem(item)
                  else if (action === 'delete') deleteItem(item)
                }}
              />
            ) : (
              <div style={{ padding: '8px', 'font-size': '11px', color: 'var(--text-muted)' }}>
                <div style={{ 'margin-bottom': '6px' }}>Archivos locales:</div>
                <For each={Object.keys(loadLocalFiles())}>
                  {(name) => (
                    <div onClick={() => openLocal(name)} style={{
                      padding: '4px 6px', cursor: 'pointer', 'border-radius': '4px', 'font-family': 'monospace', 'font-size': '11px',
                    }}>📄 {name}</div>
                  )}
                </For>
              </div>
            )}
          </div>

          {/* Editor + tabs */}
          <div style={{ flex: 1, display: 'flex', 'flex-direction': 'column', 'min-width': 0 }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', 'align-items': 'center', gap: '2px', padding: '4px 6px 0',
              'border-bottom': '1px solid var(--border-window)', 'flex-shrink': 0, 'flex-wrap': 'wrap', 'min-height': '30px',
            }}>
              <For each={tabs()}>
                {(t, i) => (
                  <div
                    onClick={() => setActiveIdx(i())}
                    style={{
                      display: 'flex', 'align-items': 'center', gap: '5px', cursor: 'pointer',
                      padding: '4px 8px', 'border-radius': '5px 5px 0 0', 'font-size': '11px',
                      'font-family': 'monospace', 'max-width': '160px',
                      background: i() === activeIdx() ? 'var(--bg-desktop)' : 'transparent',
                      border: i() === activeIdx() ? '1px solid var(--border-window)' : '1px solid transparent',
                      'border-bottom': 'none',
                    }}
                  >
                    <span style={{ overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>{t.name}</span>
                    <span style={{ color: t.dirty ? 'var(--warning)' : 'transparent' }}>●</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); closeTab(i()) }}
                      style={{ color: 'var(--text-muted)', 'font-size': '10px', cursor: 'pointer' }}
                    >✕</span>
                  </div>
                )}
              </For>
              <Show when={!tabs().length}>
                <span style={{ 'font-size': '11px', color: 'var(--text-muted)', padding: '4px 8px' }}>
                  {hasFiles ? 'Abre un archivo del workspace' : 'Abre un archivo local'}
                </span>
              </Show>
            </div>

            {/* Editor */}
            <Show when={active()} fallback={
              <div style={{ flex: 1, display: 'flex', 'align-items': 'center', 'justify-content': 'center', color: 'var(--text-muted)', 'font-size': '12px', 'flex-direction': 'column', gap: '8px' }}>
                <div style={{ 'font-size': '32px', opacity: 0.6 }}>🧑‍💻</div>
                <div>El editor nativo de YOLA</div>
                <div style={{ 'font-size': '11px', opacity: 0.7 }}>Ctrl+P para comandos · {hasFiles ? 'explora el workspace a la izquierda' : 'abre un archivo local'}</div>
              </div>
            }>
              <Editor
                content={active().content}
                lang={active().lang}
                name={active().name}
                onChange={updateActive}
                onSave={saveTab}
                onTa={(el) => { taRef = el }}
                onCursor={(pos) => setCursor(pos)}
                onSelection={setHasSelection}
              />
            </Show>

            {/* Panel de búsqueda */}
            <Show when={searchOpen() && active()}>
              <div style={{
                display: 'flex', 'align-items': 'center', gap: '6px', padding: '4px 8px',
                'border-top': '1px solid var(--border-window)', 'flex-shrink': 0, background: 'var(--bg-window-header)',
              }}>
                <span style={{ 'font-size': '11px' }}>🔍</span>
                <input
                  value={searchQuery()}
                  onInput={e => { setSearchQuery(e.target.value); setSearchIdx(0) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') nextMatch(e.shiftKey ? -1 : 1)
                    if (e.key === 'Escape') setSearchOpen(false)
                  }}
                  className="yola-input"
                  placeholder="Buscar en el archivo…"
                  style={{
                    flex: 1, padding: '4px 8px', border: '1px solid var(--border-window)', 'border-radius': '4px',
                    background: 'var(--bg-desktop)', color: 'var(--text-primary)', outline: 'none', 'font-size': '11px',
                    'font-family': 'var(--font)',
                  }}
                />
                <span style={{ 'font-size': '10.5px', color: 'var(--text-muted)' }}>
                  {searchMatches().length ? `${searchIdx() + 1}/${searchMatches().length}` : '—'}
                </span>
                <button onClick={() => nextMatch(1)} style={btnStyle} aria-label="Siguiente">↓</button>
                <button onClick={() => nextMatch(-1)} style={btnStyle} aria-label="Anterior">↑</button>
                <button onClick={() => setSearchOpen(false)} style={btnStyle} aria-label="Cerrar búsqueda">✕</button>
              </div>
            </Show>

            {/* Footer */}
            <div style={{
              display: 'flex', gap: '12px', padding: '3px 12px', 'font-size': '10.5px',
              color: 'var(--text-muted)', 'border-top': '1px solid var(--border-window)',
              'flex-shrink': 0, 'align-items': 'center',
            }}>
              <Show when={active()}>
                <span>{active().name}</span>
                <span>{detectLanguage(active().name)}</span>
                <span>{active().content.split('\n').length} líneas · {active().content.trim() ? active().content.trim().split(/\s+/).length : 0} palabras</span>
                <Show when={cursor()}>
                  <span>Ln {cursor().line}, Col {cursor().col}</span>
                </Show>
              </Show>
              <span style={{ 'margin-left': 'auto' }}>Solid + Vite · v0.8.0</span>
              <button onClick={() => setHelpOpen(v => !v)} style={btnStyle} title="Atajos (F1)" aria-label="Atajos de teclado">❓</button>
            </div>
          </div>

          {/* Panel del agente (derecho, colapsable) */}
          <AgentPanel
            api={api}
            open={agentOpen()}
            onClose={() => { setAgentOpen(false); focusEditor() }}
            getActiveFile={() => active()}
            getSelection={() => taRef ? { s: taRef.selectionStart, e: taRef.selectionEnd } : null}
            onApplyToActive={applyToActive}
            prefill={agentPrefill()}
            onPrefillConsumed={() => setAgentPrefill('')}
            filesApi={filesApi}
          />
        </div>

        {/* Terminal integrada (Ctrl+`) — ejecuta en el workspace activo */}
        <Show when={terminalOpen()}>
          <TerminalPanel
            daemonUrl={hasFiles ? api.os.daemonUrl : null}
            cwd={workspace() || undefined}
            onClose={() => { setTerminalOpen(false); focusEditor() }}
          />
        </Show>

        {/* ── Templates ── */}
        <TemplatesPanel
          open={templateOpen()}
          onClose={() => { setTemplateOpen(false); focusEditor() }}
          onGenerate={handleGenerateTemplate}
          filesApi={filesApi}
          workspace={workspace()}
        />

        {/* ── Paleta ── */}
        <Palette
          open={palette()}
          mode={paletteMode()}
          commands={commands()}
          files={paletteFiles()}
          recent={recent()}
          onClose={() => { setPalette(false); focusEditor() }}
          onOpenFile={(f) => { openFile(f.path, f.name) }}
        />

        {/* ── Búsqueda en workspace ── */}
        <Show when={hasFiles}>
          <WorkspaceSearch
            open={wsSearch()}
            filesApi={filesApi}
            workspace={workspace()}
            query={wsQuery}
            onQuery={setWsQuery}
            onClose={() => { setWsSearch(false); focusEditor() }}
            onOpenFile={(path, line) => { setWsSearch(false); openFile(path, path.split('/').pop(), line) }}
          />
        </Show>

        {/* ── Atajos ── */}
        <Show when={helpOpen()}>
          <div style={{
            position: 'absolute', inset: '0', zIndex: '40', background: 'var(--bg-overlay)',
            display: 'flex', 'align-items': 'flex-start', 'justify-content': 'center', paddingTop: '50px',
          }} onClick={() => { setHelpOpen(false); focusEditor() }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '440px', 'max-width': '92%', background: 'var(--bg-window)',
                border: '1px solid var(--border-window)', 'border-radius': '10px',
                'box-shadow': 'var(--shadow)', padding: '14px', 'font-size': '12px',
                display: 'flex', 'flex-direction': 'column', gap: '6px', 'max-height': '70vh', 'overflow-y': 'auto',
              }}
            >
              <div style={{ 'font-weight': 600, 'margin-bottom': '4px' }}>Atajos de teclado</div>
              <Shortcut keys="Ctrl+P" label="Abrir archivo (fuzzy)" />
              <Shortcut keys="Ctrl+Shift+P" label="Paleta de comandos" />
              <Shortcut keys="Ctrl+F" label="Buscar en archivo" />
              <Shortcut keys="Ctrl+Shift+F" label="Buscar en el workspace" />
              <Shortcut keys="Ctrl+S" label="Guardar archivo" />
              <Shortcut keys="Ctrl+Z / Ctrl+Shift+Z" label="Deshacer / Rehacer" />
              <Shortcut keys="Ctrl+D" label="Duplicar línea o selección" />
              <Shortcut keys="Ctrl+/" label="Comentar / descomentar" />
              <Shortcut keys="Alt+↑ ↓" label="Mover línea" />
              <Shortcut keys="Ctrl+W" label="Cerrar pestaña" />
              <Shortcut keys="Ctrl+Tab" label="Siguiente pestaña" />
              <Shortcut keys="Ctrl+J" label="Panel del agente" />
              <Shortcut keys="Ctrl+`" label="Terminal (build, tests, git)" />
              <Shortcut keys="Tab" label="Indentar (2 espacios)" />
              <Shortcut keys="Esc" label="Cerrar panel" />
              <Shortcut keys="F1" label="Este panel" />
              <div style={{ 'font-size': '10.5px', color: 'var(--text-muted)', 'margin-top': '2px' }}>
                Escribe y el editor sugiere palabras del archivo (Enter acepta, ↑↓ navega).
              </div>
              <div style={{ 'font-weight': 600, 'margin-top': '10px', 'margin-bottom': '4px' }}>Explorer (clic derecho)</div>
              <div style={{ 'font-size': '11px', color: 'var(--text-secondary)' }}>Nuevo archivo · Nueva carpeta · Renombrar · Eliminar</div>
              <div style={{ 'font-weight': 600, 'margin-top': '10px', 'margin-bottom': '4px' }}>Agente (panel derecho)</div>
              <div style={{ 'font-size': '11px', color: 'var(--text-secondary)' }}>
                Selecciona código y pulsa ✨ (o Ctrl+J y escribe). El contexto del archivo activo viaja solo.
                Cuando el agente responda con código, usa «💾 Aplicar al archivo» para ver el preview y escribir en disco.
                Las sesiones se comparten con el Chat del OS (tag #yola-code).
              </div>
              <button onClick={() => { setHelpOpen(false); focusEditor() }} style={{ ...btnAccent, 'margin-top': '10px', alignSelf: 'flex-end' }}>Cerrar</button>
            </div>
          </div>
        </Show>

        {/* ── Manifest ── */}
        <Show when={manifestOpen()}>
          <pre style={{
            position: 'absolute', inset: '0', zIndex: '30', margin: 0, padding: '14px',
            background: 'var(--bg-desktop)', color: 'var(--text-primary)', overflow: 'auto',
            'font-size': '11px', 'line-height': '1.5', 'font-family': 'monospace',
          }}>{manifestText()}</pre>
          <button onClick={() => { setManifestOpen(false); focusEditor() }} style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: '31', padding: '5px 12px',
            border: '1px solid var(--border-window)', 'border-radius': '5px', background: 'var(--bg-window)',
            color: 'var(--text-primary)', cursor: 'pointer', 'font-family': 'var(--font)',
          }}>✕ Cerrar</button>
        </Show>
      </div>
    )
  }
}

function Shortcut(props) {
  return (
    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
      <span>{props.label}</span>
      <span style={{
        'font-family': 'monospace', 'font-size': '10.5px', padding: '1px 7px',
        border: '1px solid var(--border-window)', 'border-radius': '5px',
        color: 'var(--text-secondary)', background: 'var(--bg-window-header)',
      }}>{props.keys}</span>
    </div>
  )
}


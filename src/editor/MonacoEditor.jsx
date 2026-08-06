// ── YOLA Code — Monaco Editor (VS Code engine) ───────────────
// Monaco se carga dinámicamente (bundle pesado ~5MB). El componente
// expone el mismo contrato que el Editor viejo: { content, lang,
// onChange, onSave, dirty, onCursor } para drop-in replacement.
// ──────────────────────────────────────────────────────────────
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js'

// Detectar si es texto plano (Monaco lo maneja, pero evitamos cargar por binarios)
const BINARY_EXTS = new Set([
  'png','jpg','jpeg','gif','webp','ico','bmp','svg','mp3','wav','ogg','flac',
  'mp4','webm','avi','mov','mkv','zip','tar','gz','rar','7z','exe','dll',
  'so','dylib','wasm','bin','dat','db','sqlite','pdf','ttf','woff','woff2','eot'
])

function isBinaryFile(name) {
  const ext = (name || '').split('.').pop()?.toLowerCase()
  return BINARY_EXTS.has(ext)
}

// Mapa de extensiones → language ID de Monaco
const LANG_MAP = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  json: 'json', jsonc: 'json',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', less: 'less',
  md: 'markdown', mdx: 'markdown',
  py: 'python', rb: 'ruby', rs: 'rust', go: 'go',
  java: 'java', kt: 'kotlin', scala: 'scala',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp',
  cs: 'csharp', fs: 'fsharp', vb: 'vb',
  php: 'php', sql: 'sql', graphql: 'graphql', gql: 'graphql',
  yaml: 'yaml', yml: 'yaml', toml: 'toml', ini: 'ini', cfg: 'ini',
  xml: 'xml', svg: 'xml',
  sh: 'shell', bash: 'shell', zsh: 'shell', fish: 'shell',
  ps1: 'powershell', bat: 'bat', cmd: 'bat',
  dockerfile: 'dockerfile',
  vue: 'html', svelte: 'html', astro: 'html',
}

function langId(name, fallback) {
  if (!name) return fallback || 'plaintext'
  const ext = name.split('.').pop()?.toLowerCase()
  return LANG_MAP[ext] || LANG_MAP[fallback] || 'plaintext'
}

export function MonacoEditor(props) {
  // props: { content, lang, onChange, onSave, dirty, onCursor, onTa, name }
  const [ready, setReady] = createSignal(false)
  const [loadErr, setLoadErr] = createSignal('')
  let containerRef
  let editorRef = null
  let monacoRef = null
  let ignoreNextChange = false
  let disposeModel = null

  // Carga dinámica de Monaco
  onMount(async () => {
    if (isBinaryFile(props.name)) {
      setLoadErr('Archivo binario — sin editor')
      return
    }
    try {
      // Monaco se importa bajo demanda (code splitting)
      const monaco = await import('monaco-editor')
      monacoRef = monaco

      // Configurar workers (evita warnings en consola)
      self.MonacoEnvironment = {
        getWorker(_, label) {
          if (label === 'json') return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url), { type: 'module' })
          if (label === 'css' || label === 'scss' || label === 'less') return new Worker(new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url), { type: 'module' })
          if (label === 'html' || label === 'handlebars' || label === 'razor') return new Worker(new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url), { type: 'module' })
          if (label === 'typescript' || label === 'javascript') return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url), { type: 'module' })
          return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' })
        }
      }

      const lang = langId(props.name, props.lang)
      const model = monaco.editor.createModel(props.content || '', lang)

      editorRef = monaco.editor.create(containerRef, {
        model,
        theme: 'vs-dark',
        fontSize: 13,
        fontFamily: 'ui-monospace, Consolas, "Cascadia Code", monospace',
        lineNumbers: 'on',
        minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
        scrollBeyondLastLine: false,
        wordWrap: 'off',
        tabSize: 2,
        insertSpaces: true,
        automaticLayout: true,
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        renderWhitespace: 'selection',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 8 },
        suggest: { showWords: true, showSnippets: true },
        quickSuggestions: true,
        folding: true,
        links: true,
        contextmenu: true,
      })

      // Ctrl+S → guardar
      editorRef.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        props.onSave?.()
      })

      // Notificar cambios
      editorRef.onDidChangeModelContent(() => {
        if (ignoreNextChange) { ignoreNextChange = false; return }
        const val = editorRef.getValue()
        props.onChange?.(val)
      })

      // Notificar cursor
      editorRef.onDidChangeCursorPosition((e) => {
        props.onCursor?.({
          line: e.position.lineNumber,
          col: e.position.column,
        })
      })

      // Notificar selección (para "Mejorar con YOLA")
      editorRef.onDidChangeCursorSelection((e) => {
        const hasSel = !e.selection.isEmpty()
        props.onSelection?.(hasSel)
      })

      setReady(true)
    } catch (e) {
      setLoadErr(`Monaco no disponible: ${e.message}`)
    }
  })

  // Sincronizar contenido externo (ej: archivo cambiado fuera del editor)
  createEffect(() => {
    if (!editorRef || !monacoRef) return
    const current = editorRef.getValue()
    if (props.content !== current) {
      ignoreNextChange = true
      editorRef.setValue(props.content || '')
    }
  })

  // Sincronizar lenguaje
  createEffect(() => {
    if (!editorRef || !monacoRef) return
    const lang = langId(props.name, props.lang)
    const model = editorRef.getModel()
    if (model) monacoRef.editor.setModelLanguage(model, lang)
  })

  // ── API compatible con textarea (para App.jsx) ──
  // Monaco no tiene textarea nativo, exponemos un wrapper
  createEffect(() => {
    if (ready() && editorRef && props.onTa) {
      const api = {
        focus: () => editorRef.focus(),
        get selectionStart() {
          const sel = editorRef.getSelection()
          if (!sel) return 0
          return editorRef.getModel().getOffsetAt(sel.getStartPosition())
        },
        get selectionEnd() {
          const sel = editorRef.getSelection()
          if (!sel) return 0
          return editorRef.getModel().getOffsetAt(sel.getEndPosition())
        },
        setSelectionRange: (start, end) => {
          const model = editorRef.getModel()
          if (!model) return
          const p1 = model.getPositionAt(start)
          const p2 = model.getPositionAt(end)
          editorRef.setSelection({ startLineNumber: p1.lineNumber, startColumn: p1.column, endLineNumber: p2.lineNumber, endColumn: p2.column })
          editorRef.revealPositionInCenter(p1)
        },
        get value() { return editorRef.getValue() },
      }
      props.onTa(api)
    }
  })

  // Limpiar al desmontar
  onCleanup(() => {
    if (editorRef) {
      const model = editorRef.getModel()
      editorRef.dispose()
      if (model) model.dispose()
    }
  })

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Show when={loadErr()}>
        <div style={{ padding: '2rem', color: '#888', 'font-family': 'monospace' }}>
          {loadErr()}
        </div>
      </Show>
      <Show when={!loadErr()}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <Show when={!ready()}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            background: '#1e1e1e', color: '#888', 'font-family': 'monospace'
          }}>
            Cargando editor...
          </div>
        </Show>
      </Show>
    </div>
  )
}

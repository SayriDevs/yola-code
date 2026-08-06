// ── YOLA Code — Explorador del workspace (árbol real) ────────
import { createSignal, createEffect, For, Show } from 'solid-js'

export function Explorer(props) {
  // props: { filesApi, workspace, onOpenFile, onAction }
  const [dirs, setDirs] = createSignal({}) // path -> {loaded, entries[]} | null (cargando)
  const [root, setRoot] = createSignal(null)
  const [menu, setMenu] = createSignal(null) // {x, y, item}
  let menuRef = null
  let menuBackdropRef = null
  const [filter, setFilter] = createSignal('') // búsqueda de archivos por nombre
  const [hits, setHits] = createSignal(null) // null = sin buscar | [] = sin matches | [{path, absolute, name}]
  const [hitLoading, setHitLoading] = createSignal(false)
  const [filterErr, setFilterErr] = createSignal('')
  let debounceRef = null
  let walkAbort = null

  async function loadDir(path) {
    setDirs(prev => ({ ...prev, [path]: null })) // null = cargando
    try {
      const entries = await props.filesApi.list(props.workspace, path === '/' ? '' : path)
      const items = Array.isArray(entries) ? entries : []
      setDirs(prev => ({ ...prev, [path]: { loaded: true, entries: items } }))
    } catch (e) {
      // ERROR VISIBLE — nunca "Vacío" silencioso (enmascara la causa real)
      setDirs(prev => ({ ...prev, [path]: { loaded: true, entries: [], error: e.message } }))
    }
  }

  // Búsqueda por nombre: recorre el árbol completo (límite prof. 6)
  async function searchFiles(q) {
    if (!q) { setHits(null); setHitLoading(false); setFilterErr(''); return }
    setHitLoading(true)
    if (walkAbort) walkAbort.abort()
    const ac = new AbortController()
    walkAbort = ac
    const found = []
    const ql = q.toLowerCase()
    let walkErr = ''

    async function walk(dir, depth) {
      if (ac.signal.aborted) return
      if (depth > 6) return
      let entries
      try {
        entries = await props.filesApi.list(props.workspace, dir === '/' ? '' : dir)
      } catch (e) { walkErr = e.message; return }
      for (const item of entries) {
        if (ac.signal.aborted) return
        if (item.type === 'dir') await walk(item.path, depth + 1)
        else if ((item.name || '').toLowerCase().includes(ql)) {
          found.push({ path: item.path, absolute: item.absolute || item.path, name: item.name })
          if (found.length >= 100) return
        }
      }
    }

    await walk('/', 0)
    if (!ac.signal.aborted) { setHits(found); setHitLoading(false); setFilterErr(walkErr) }
  }

  const [lastRefresh, setLastRefresh] = createSignal(0)

  // el menú contextual recibe foco al abrir (para que Escape cierre)
  createEffect(() => {
    if (menu() && menuBackdropRef) menuBackdropRef.focus()
  })

  // Cuando cambia el workspace (o refresh++): reiniciar el árbol.
  // IMPORTANTE: declaraciones ANTES de efectos — el minificador reordena
  // las const y un effect que use una señal declarada después explota
  // con "Cannot access X before initialization" en el bundle final.
  createEffect(() => {
    const ws = props.workspace
    const rk = props.refresh || 0
    if (ws !== root() || rk !== lastRefresh()) {
      setRoot(ws)
      setLastRefresh(rk)
      setDirs({})
      setFilter('')
      setHits(null)
      if (ws) loadDir('/')
    }
  })

  function toggleDir(path) {
    if (dirs()[path]?.loaded) {
      setDirs(prev => {
        const next = { ...prev }
        delete next[path]
        return next
      })
      return
    }
    loadDir(path)
  }

  function renderEntries(path, depth) {
    const state = dirs()[path]
    if (state === null) {
      return <div style={{ padding: `${4 + depth * 14}px 8px`, 'font-size': '11px', color: 'var(--text-muted)' }}>Cargando…</div>
    }
    if (state?.error) {
      return <div style={{ padding: `${4 + depth * 14}px 8px`, 'font-size': '10.5px', color: 'var(--danger)' }} title={state.error}>⛔ {state.error}</div>
    }
    if (!state?.entries?.length) {
      return <div style={{ padding: `${4 + depth * 14}px 8px`, 'font-size': '11px', color: 'var(--text-muted)', opacity: 0.7 }}>Vacío</div>
    }
    return (
      <For each={state.entries}>
        {(item) => (
          <div>
            <div
              onClick={() => (item.type === 'dir' ? toggleDir(item.path) : props.onOpenFile?.(item.absolute || item.path))}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenu({ x: e.clientX, y: e.clientY, item })
              }}
              style={{
                display: 'flex', 'align-items': 'center', gap: '4px', cursor: 'pointer',
                padding: `3px 8px 3px ${6 + depth * 14}px`, 'border-radius': '4px',
                'font-size': '11px', 'font-family': 'monospace', overflow: 'hidden',
                'text-overflow': 'ellipsis', 'white-space': 'nowrap',
                color: item.type === 'dir' ? 'var(--text-secondary)' : 'var(--text-primary)',
              }}
            >
              <span>{item.type === 'dir' ? '📁' : '📄'}</span>
              <span>{item.name}</span>
            </div>
            <Show when={item.type === 'dir' && dirs()[item.path]?.loaded}>
              {renderEntries(item.path, depth + 1)}
            </Show>
          </div>
        )}
      </For>
    )
  }

  return (
    <div style={{ display: 'flex', 'flex-direction': 'column', height: '100%' }}>
      <div style={{
        padding: '5px 8px', 'font-size': '10.5px', color: 'var(--text-secondary)',
        'border-bottom': '1px solid var(--border-window)', overflow: 'hidden',
        'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'font-family': 'monospace',
      }} title={props.workspace}>{props.workspace || 'sin workspace'}</div>
      <Show when={props.workspace}>
        <div style={{ padding: '4px 6px', 'border-bottom': '1px solid var(--border-window)' }}>
          <input
            value={filter()}
            onInput={(e) => {
              setFilter(e.target.value)
              clearTimeout(debounceRef)
              debounceRef = setTimeout(() => searchFiles(e.target.value.trim()), 280)
            }}
            className="yola-input"
            placeholder="Buscar archivo por nombre…"
            style={{
              width: '100%', padding: '4px 7px', border: '1px solid var(--border-window)',
              'border-radius': '5px', background: 'var(--bg-desktop)', color: 'var(--text-primary)',
              outline: 'none', 'font-size': '11px', 'font-family': 'var(--font)', 'box-sizing': 'border-box',
            }}
          />
        </div>
      </Show>
      <div style={{ flex: 1, 'overflow-y': 'auto', padding: '4px 0 8px' }}>
        <Show when={filter() && hits() !== null}>
          <Show when={filterErr()}>
            <div style={{ padding: '8px', 'font-size': '10.5px', color: 'var(--danger)' }}>⛔ {filterErr()}</div>
          </Show>
          <Show when={hitLoading()} fallback={
            hits().length ? (
              <For each={hits()}>
                {(h) => (
                  <div
                    onClick={() => props.onOpenFile?.(h.absolute)}
                    style={{
                      display: 'flex', 'align-items': 'center', gap: '4px', cursor: 'pointer',
                      padding: '3px 8px 3px 6px', 'border-radius': '4px',
                      'font-size': '11px', 'font-family': 'monospace', overflow: 'hidden',
                      'text-overflow': 'ellipsis', 'white-space': 'nowrap',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>📄</span>
                    <span>{h.name}</span>
                    <span style={{ color: 'var(--text-muted)', 'font-size': '10px', 'margin-left': 'auto', overflow: 'hidden', 'text-overflow': 'ellipsis' }}>{h.path}</span>
                  </div>
                )}
              </For>
            ) : (
              <div style={{ padding: '8px', 'font-size': '11px', color: 'var(--text-muted)' }}>
                Sin archivos con «{filter()}»
              </div>
            )
          }>
            <div style={{ padding: '8px', 'font-size': '11px', color: 'var(--text-muted)' }}>Buscando…</div>
          </Show>
        </Show>
        <Show when={!filter() || hits() === null}>
          <Show when={props.workspace} fallback={
            <div style={{ padding: '12px 8px', 'font-size': '11px', color: 'var(--text-muted)' }}>
              Sin workspace. Usa ☰ para abrir uno.
            </div>
          }>
            {renderEntries('/', 0)}
          </Show>
        </Show>
      </div>

      {/* Menú contextual */}
      <Show when={menu()}>
        <div
          onClick={() => setMenu(null)}
          onContextMenu={(e) => { e.preventDefault(); setMenu(null) }}
          onKeyDown={(e) => { if (e.key === 'Escape') setMenu(null) }}
          tabIndex={0}
          ref={menuBackdropRef}
          style={{ position: 'fixed', inset: '0', zIndex: '50' }}
        />
        <div
          ref={menuRef}
          tabIndex={-1}
          onKeyDown={(e) => { if (e.key === 'Escape') setMenu(null) }}
          style={{
            position: 'fixed', left: `${Math.min(menu().x, window.innerWidth - 170)}px`,
            top: `${Math.min(menu().y, window.innerHeight - 150)}px`, zIndex: '51',
            background: 'var(--bg-window)', border: '1px solid var(--border-window)',
            'border-radius': '8px', 'box-shadow': 'var(--shadow)', padding: '4px',
            'min-width': '150px', 'font-size': '11px', 'font-family': 'var(--font)',
          }}
        >
          <MenuItem label="➕ Nuevo archivo aquí" onClick={() => { props.onAction?.('new-file', menu().item); setMenu(null) }} />
          <MenuItem label="📁 Nueva carpeta aquí" onClick={() => { props.onAction?.('new-folder', menu().item); setMenu(null) }} />
          <MenuItem label="✏️ Renombrar" onClick={() => { props.onAction?.('rename', menu().item); setMenu(null) }} />
          <MenuItem label="🗑️ Eliminar" danger onClick={() => { props.onAction?.('delete', menu().item); setMenu(null) }} />
        </div>
      </Show>
    </div>
  )
}

function MenuItem(props) {
  return (
    <div
      onClick={props.onClick}
      style={{
        padding: '5px 10px', 'border-radius': '5px', cursor: 'pointer',
        color: props.danger ? 'var(--danger)' : 'var(--text-primary)',
        'white-space': 'nowrap',
      }}
      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-window-header)' }}
      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
    >{props.label}</div>
  )
}

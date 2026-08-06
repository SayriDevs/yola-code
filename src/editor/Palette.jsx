// ── YOLA Code — Paleta de comandos / archivos ────────────────
// Ctrl+Shift+P → comandos · Ctrl+P → abrir archivo (fuzzy + recientes)
// ──────────────────────────────────────────────────────────────
import { createSignal, createMemo, For, Show, createEffect } from 'solid-js'

function fuzzyMatch(q, s) {
  q = q.toLowerCase()
  s = s.toLowerCase()
  let i = 0
  for (const ch of s) {
    if (ch === q[i]) i++
    if (i === q.length) return true
  }
  return i === q.length
}

export function Palette(props) {
  // props: { open, mode: 'commands'|'files', commands, files, recent, onClose, onOpenFile }
  const [query, setQuery] = createSignal('')
  const [active, setActive] = createSignal(0)
  let inputRef

  // foco real al abrir (el onMount no alcanza: el overlay se monta cerrado)
  createEffect(() => {
    if (props.open) {
      setActive(0)
      setTimeout(() => inputRef?.focus(), 10)
    }
  })

  const isFiles = () => props.mode === 'files'

  const filtered = createMemo(() => {
    const q = query().trim()
    if (isFiles()) {
      const files = props.files || []
      if (!q) {
        // sin query: recientes primero, luego el resto (máx 30)
        const rec = props.recent || []
        const seen = new Set(rec.map(r => r.path))
        const rest = files.filter(f => !seen.has(f.path))
        return [...rec, ...rest].slice(0, 30)
      }
      const hit = files.filter(f => fuzzyMatch(q, f.name + '/' + (f.path.split('/').pop() || '')))
      return hit.slice(0, 30)
    }
    if (!q) return props.commands
    return props.commands.filter(c => c.label.toLowerCase().includes(q.toLowerCase())).slice(0, 30)
  })

  function select(item) {
    props.onClose?.()
    if (isFiles()) props.onOpenFile?.(item)
    else item.run()
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { props.onClose?.(); return }
    if (e.key === 'Enter') { const list = filtered(); if (list[active()]) select(list[active()]); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered().length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); return }
  }

  return (
    <Show when={props.open}>
      <div style={{ position: 'absolute', inset: 0, zIndex: '30', background: 'var(--bg-overlay)', display: 'flex', 'align-items': 'flex-start', 'justify-content': 'center', paddingTop: '60px' }}>
        <div style={{
          width: '440px', 'max-width': '90%', background: 'var(--bg-window)',
          border: '1px solid var(--border-window)', 'border-radius': '10px',
          'box-shadow': 'var(--shadow)', overflow: 'hidden',
        }}>
          <input
            ref={inputRef}
            value={query()}
            onInput={e => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            className="yola-input"
            placeholder={isFiles() ? 'Archivo…' : 'Comando…'}
            style={{
              width: '100%', 'box-sizing': 'border-box', padding: '10px 12px', border: 'none',
              'border-bottom': '1px solid var(--border-window)', background: 'var(--bg-window)',
              color: 'var(--text-primary)', outline: 'none', 'font-size': '13px', 'font-family': 'var(--font)',
            }}
          />
          <div style={{ 'max-height': '300px', 'overflow-y': 'auto', padding: '4px' }}>
            <For each={filtered()}>
              {(item, i) => (
                <div
                  onClick={() => select(item)}
                  onMouseMove={() => setActive(i())}
                  style={{
                    padding: '6px 10px', 'border-radius': '6px', cursor: 'pointer',
                    display: 'flex', gap: '8px', 'align-items': 'center', 'font-size': '12px',
                    background: i() === active() ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
                  }}
                >
                  <span style={{ 'flex-shrink': 0 }}>{isFiles() ? '📄' : (item.icon || '•')}</span>
                  <span style={{ overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>
                    {isFiles() ? (item.name || item.path.split('/').pop()) : item.label}
                  </span>
                  <Show when={isFiles() && item.path}>
                    <span style={{ 'margin-left': 'auto', 'font-size': '10px', color: 'var(--text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'max-width': '180px' }}>
                      {item.path.replace(/^.*[\\/]/, '')}
                    </span>
                  </Show>
                </div>
              )}
            </For>
            <Show when={!filtered().length}>
              <div style={{ padding: '12px', 'font-size': '11px', color: 'var(--text-muted)', 'text-align': 'center' }}>
                {isFiles() ? 'Sin archivos que coincidan' : 'Sin comandos que coincidan'}
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}

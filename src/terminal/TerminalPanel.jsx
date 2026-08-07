// ── YOLA Code — Terminal integrada (Ctrl+`) ──────────────────
// Ejecuta comandos locales vía POST /api/v1/terminal/exec del daemon
// (cmd /C en Windows). cwd = workspace activo. Historial con ↑↓,
// Ctrl+L limpia. Sin streaming (fase 2) — ejecuta y muestra.
// ──────────────────────────────────────────────────────────────
import { createSignal, For, Show, onMount } from 'solid-js'

export function TerminalPanel(props) {
  // props: { daemonUrl, cwd, onClose }
  const [lines, setLines] = createSignal([]) // {kind: 'in'|'out'|'err'|'sys', text}
  const [cmd, setCmd] = createSignal('')
  const [running, setRunning] = createSignal(false)
  const [history, setHistory] = createSignal([])
  const [histIdx, setHistIdx] = createSignal(-1)
  let inputRef
  let outRef

  // el foco entra al input al abrir (nunca huérfano)
  onMount(() => inputRef?.focus())

  function scrollBottom() {
    if (outRef) outRef.scrollTop = outRef.scrollHeight
  }

  async function run() {
    const c = cmd().trim()
    if (!c || running()) return
    setLines(prev => [...prev, { kind: 'in', text: `❯ ${c}` }])
    setHistory(prev => [c, ...prev.filter(x => x !== c)].slice(0, 50))
    setHistIdx(-1)
    setCmd('')
    setRunning(true)
    try {
      const res = await fetch(`${props.daemonUrl}/api/v1/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: c, cwd: props.cwd || undefined }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        if (res.status === 404) throw new Error('El daemon no expone /terminal/exec — recompílalo (cargo build --bin yola-daemon)')
        throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`)
      }
      const data = await res.json()
      if (data.stdout) setLines(prev => [...prev, { kind: 'out', text: data.stdout.replace(/\n$/, '') }])
      if (data.stderr) setLines(prev => [...prev, { kind: 'err', text: data.stderr.replace(/\n$/, '') }])
      if (!data.stdout && !data.stderr) setLines(prev => [...prev, { kind: 'sys', text: '(sin salida)' }])
      setLines(prev => [...prev, { kind: 'sys', text: `— exit ${data.exit_code ?? '?'} · ${data.duration_ms}ms · ${data.cwd}` }])
    } catch (e) {
      setLines(prev => [...prev, { kind: 'err', text: `⛔ ${e.message}` }])
    }
    setRunning(false)
    setTimeout(scrollBottom, 30)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); run(); return }
    if (e.key === 'Escape') { e.preventDefault(); props.onClose(); return }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const h = history()
      if (!h.length) return
      const next = Math.min(histIdx() + 1, h.length - 1)
      setHistIdx(next)
      setCmd(h[next])
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = histIdx() - 1
      if (next < 0) { setHistIdx(-1); setCmd('') } else { setHistIdx(next); setCmd(history()[next]) }
      return
    }
    if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]) }
  }

  return (
    <div style={{
      height: '180px', 'flex-shrink': 0, display: 'flex', 'flex-direction': 'column',
      'border-top': '1px solid var(--border-window)', background: 'var(--bg-desktop)',
      'font-family': 'ui-monospace, Consolas, monospace', 'font-size': '11px',
    }}>
      <div style={{
        display: 'flex', 'align-items': 'center', gap: '6px', padding: '3px 8px',
        background: 'var(--bg-window-header)', 'flex-shrink': 0,
      }}>
        <span style={{ 'font-size': '11px' }}>⌨️</span>
        <span style={{ 'font-size': '10.5px', color: 'var(--text-secondary)' }}>Terminal</span>
        <span style={{ 'font-size': '9.5px', color: 'var(--text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'max-width': '240px' }} title={props.cwd}>{props.cwd || 'sin workspace'}</span>
        <div style={{ flex: 1 }} />
        <span style={{ 'font-size': '9.5px', color: 'var(--text-muted)' }}>Ctrl+L limpia</span>
        <button onClick={() => setLines([])} style={btn} title="Limpiar">🧹</button>
        <button onClick={props.onClose} style={btn} title="Cerrar terminal (Ctrl+`)">✕</button>
      </div>
      <div
        ref={outRef}
        style={{ flex: 1, overflow: 'auto', padding: '4px 8px', 'line-height': '1.5', 'white-space': 'pre-wrap', 'word-break': 'break-all' }}
      >
        <Show when={!lines().length}>
          <div style={{ color: 'var(--text-muted)', 'font-size': '10.5px' }}>
            Ejecuta comandos en {props.cwd || 'tu máquina'} — build, tests, git… (↑↓ historial)
          </div>
        </Show>
        <For each={lines()}>
          {(l) => (
            <div style={{
              color: l.kind === 'err' ? 'var(--danger)'
                : l.kind === 'sys' ? 'var(--text-muted)'
                : l.kind === 'in' ? 'var(--accent)'
                : 'var(--text-primary)',
            }}>{l.text}</div>
          )}
        </For>
      </div>
      <div style={{ display: 'flex', 'align-items': 'center', gap: '6px', padding: '4px 8px', 'flex-shrink': 0 }}>
        <span style={{ color: 'var(--success)' }}>❯</span>
        <input
          ref={inputRef}
          value={cmd()}
          onInput={(e) => setCmd(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="escribe un comando…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)',
            'font-family': 'ui-monospace, Consolas, monospace', 'font-size': '11px',
          }}
        />
        <Show when={running()}>
          <span style={{ 'font-size': '10px', color: 'var(--warning)' }}>ejecutando…</span>
        </Show>
      </div>
    </div>
  )
}

const btn = {
  padding: '2px 7px', cursor: 'pointer', border: '1px solid var(--border-window)',
  'border-radius': '5px', background: 'transparent', color: 'var(--text-secondary)',
  'font-size': '10.5px', 'font-family': 'var(--font)',
}

// ── YOLA Code — Panel del agente (chat de trabajo, derecho) ──
// Mismo contrato que el Chat del OS: sesiones compartidas (tags
// visibles), streaming SSE. Contexto automático del archivo activo
// y botones de acción: aplicar al archivo (preview + confirmar).
// ──────────────────────────────────────────────────────────────
import { createSignal, createEffect, For, Show, onMount } from 'solid-js'
import { createAgentClient } from './client'
import { extractCodeBlock } from './sse'
import { parseChecklist, diffLines, isFileWritingTool, toolPath } from './plan'

const TAG = 'yola-code'

export function AgentPanel(props) {
  // props: { api, open, onClose, getActiveFile, getSelection, onApplyToActive, prefill, onPrefillConsumed, filesApi }
  const daemonUrl = props.api?.os?.daemonUrl || 'http://localhost:7779'
  const client = createAgentClient(daemonUrl)

  const [mode, setMode] = createSignal('chat') // 'chat' | 'plan'
  const [todos, setTodos] = createSignal([]) // [{title, done}] del plan del agente
  const [diffs, setDiffs] = createSignal([]) // [{id, path, before, after}]
  const pendingWrites = new Map() // tool_call id → {path, before}

  const [sessions, setSessions] = createSignal([])
  const [sessionId, setSessionId] = createSignal(localStorage.getItem('yola-code-session') || '')
  const [messages, setMessages] = createSignal([])
  const [input, setInput] = createSignal('')
  const [includeContext, setIncludeContext] = createSignal(true)
  const [streaming, setStreaming] = createSignal(false)
  const [error, setError] = createSignal('')
  const [applyTarget, setApplyTarget] = createSignal(null) // {original, proposed, lang, hasSelection}
  const [sending, setSending] = createSignal(false)
  const [attached, setAttached] = createSignal(null) // {size} — selección adjunta vía ✨
  const [tools, setTools] = createSignal([]) // [{id, name, args, status: 'run'|'ok'|'err', duration}]
  let inputRef
  let abortRef = null

  async function loadSessions() {
    try {
      const list = await client.listSessions()
      const arr = Array.isArray(list) ? list : []
      setSessions(arr)
      // si la sesión recordada ya no existe, elegir la última con tag yola-code o la primera
      const current = sessionId()
      if (current && !arr.some(s => s.id === current)) {
        const mine = arr.find(s => s.tag === TAG)
        setSessionId(mine?.id || arr[arr.length - 1]?.id || '')
        localStorage.setItem('yola-code-session', mine?.id || '')
      }
    } catch (e) {
      setError(`Sin daemon: ${e.message}`)
    }
  }

  onMount(() => {
    if (props.open) loadSessions()
  })

  createEffect(() => {
    if (props.open) {
      loadSessions()
      setTimeout(() => inputRef?.focus(), 60)
    }
  })

  // prefill (selección para mejorar) viene de App — visible como chip
  createEffect(() => {
    const p = props.prefill
    if (p) {
      setInput(p)
      setIncludeContext(true)
      setAttached({ size: p.length })
      props.onPrefillConsumed?.()
      setTimeout(() => inputRef?.focus(), 60)
    }
  })

  function clearAttached() {
    setAttached(null)
    setInput('')
  }

  async function revertDiff(diff) {
    if (!props.filesApi) return
    try {
      await props.filesApi.write(diff.path, diff.before)
      setDiffs(prev => prev.filter(d => d.id !== diff.id))
      flash('↩ Cambio revertido')
    } catch (e) {
      flash(`⛔ ${e.message}`)
    }
  }

  function pickSession(id) {
    setSessionId(id)
    localStorage.setItem('yola-code-session', id)
  }

  function contextText() {
    const f = props.getActiveFile?.()
    if (!f) return ''
    const sel = props.getSelection?.()
    const hasSel = sel && sel.s !== sel.e
    const code = hasSel ? f.content.slice(sel.s, sel.e) : f.content
    const kind = hasSel ? 'selección' : 'archivo'
    return `\n\n— ${kind}: ${f.name} —\n${code}`
  }

  async function send(rawText, opts = {}) {
    // opts: { asPlan } → el agente PROPONE (no ejecuta) · { approve } → ejecuta el plan aprobado
    const text = (rawText ?? input()).trim()
    if (!text || sending()) return
    setSending(true)
    setError('')
    let prompt = text
    if (opts.asPlan) {
      prompt = 'Actúa como planificador. Propón un plan claro como checklist markdown (- [ ] ítems), uno por cambio. NO ejecutes nada todavía.\n\nTarea: ' + text
    } else if (opts.approve) {
      prompt = 'El plan fue aprobado. Ejecútalo ahora completo, marcando cada ítem del checklist al terminarlo. Usa tus herramientas.'
    }
    if (includeContext() && !opts.approve) prompt = prompt + contextText()
    let sid = sessionId()
    try {
      if (!sid) {
        const created = await client.createSession({ tag: TAG })
        sid = created?.id || created?.session?.id
        if (!sid) throw new Error('el daemon no devolvió id de sesión')
        setSessionId(sid)
        localStorage.setItem('yola-code-session', sid)
        loadSessions()
      }
      setMessages(prev => [...prev, { role: 'user', text }])
      setMessages(prev => [...prev, { role: 'agent', text: '', pending: true }])
      setTools([]) // las tool-calls del turno
      setInput('')
      setStreaming(true)
      abortRef = new AbortController()
      await client.sendPrompt(sid, prompt, {
        signal: abortRef.signal,
        onToken: (t) => {
          setMessages(prev => {
            const i = prev.length - 1
            return prev.map((m, idx) => idx === i ? { ...m, text: m.text + t } : m)
          })
        },
        onToolCall: (ev) => {
          // el agente EMPEZÓ a usar una herramienta — visible al instante
          setTools(prev => [...prev, {
            id: ev.id,
            name: ev.name || 'tool',
            args: ev.arguments,
            status: 'run',
          }])
          // si escribe archivos: capturar el ANTES para el diff individual
          if (isFileWritingTool(ev.name) && props.filesApi) {
            const path = toolPath(ev.arguments)
            if (path) {
              props.filesApi.read(path)
                .then(before => pendingWrites.set(ev.id, { path, before }))
                .catch(() => { /* archivo nuevo o ilegible: sin diff */ })
            }
          }
        },
        onToolResult: (ev) => {
          setTools(prev => prev.map(t => t.id === ev.id
            ? { ...t, status: ev.success ? 'ok' : 'err', duration: ev.duration_ms }
            : t))
          // capturar el DESPUÉS → generar la tarjeta de diff con revert
          const pending = pendingWrites.get(ev.id)
          if (pending && ev.success !== false && props.filesApi) {
            pendingWrites.delete(ev.id)
            props.filesApi.read(pending.path)
              .then(after => {
                if (after !== pending.before) {
                  setDiffs(prev => [...prev, { id: ev.id, path: pending.path, before: pending.before, after }])
                }
              })
              .catch(() => { /* ilegible */ })
          }
        },
        onError: (e) => {
          // el error DEBE finalizar el stream: la UI no puede quedar
          // pegada en "Pensando…" con el botón bloqueado
          setError(e.message)
          setMessages(prev => prev.map((m, idx) => idx === prev.length - 1
            ? { ...m, pending: false, text: m.text ? `${m.text}\n\n⛔ ${e.message}` : `⛔ ${e.message}` }
            : m))
          setStreaming(false)
          setSending(false)
        },
        onDone: () => {
          const last = messages()
          const finalText = last[last.length - 1]?.text || ''
          setMessages(prev => prev.map((m, idx) => idx === prev.length - 1 ? { ...m, pending: false } : m))
          setStreaming(false)
          setSending(false)
          // en modo plan: la respuesta final ES el plan → tarjetas de todos
          if (mode() === 'plan' && finalText) setTodos(parseChecklist(finalText))
        },
      })
    } catch (e) {
      setError(e.message)
      setSending(false)
      setStreaming(false)
    }
  }

  function stop() {
    abortRef?.abort()
    setStreaming(false)
    setSending(false)
  }

  function requestApply(msg) {
    const f = props.getActiveFile?.()
    if (!f) return
    const sel = props.getSelection?.()
    const hasSel = sel && sel.s !== sel.e
    const block = extractCodeBlock(msg.text)
    if (!block) return
    // CAPTURAR el estado al momento del clic (el editor pudo cambiar luego)
    const original = hasSel ? f.content.slice(sel.s, sel.e) : f.content
    setApplyTarget({
      original,
      proposed: block.code,
      lang: block.lang,
      hasSelection: hasSel,
      file: f.name,
      sel: hasSel ? { s: sel.s, e: sel.e } : null,
      path: f.path,
    })
  }

  function cancelApply() {
    setApplyTarget(null)
  }

  const [flashMsg, setFlashMsg] = createSignal('')
  function flash(m) {
    setFlashMsg(m)
    setTimeout(() => setFlashMsg(''), 2200)
  }

  function confirmApply() {
    const t = applyTarget()
    if (!t) return
    // aplicar contra lo CAPTURADO (selección original), nunca la actual
    props.onApplyToActive?.(t.proposed, t.sel)
    setApplyTarget(null)
    flash('✨ Cambio aplicado al archivo')
  }

  return (
    <Show when={props.open}>
      <div style={{
        width: '300px', 'flex-shrink': 0, 'border-left': '1px solid var(--border-window)',
        background: 'var(--bg-window)', display: 'flex', 'flex-direction': 'column', 'min-height': '0',
        'font-family': 'var(--font)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', 'align-items': 'center', gap: '6px', padding: '6px 8px',
          'border-bottom': '1px solid var(--border-window)', 'flex-shrink': 0,
        }}>
          <span style={{ 'font-size': '13px' }}>✨</span>
          <span style={{ 'font-weight': 600, 'font-size': '12px' }}>YOLA</span>
          {/* Modo: chat conversacional vs plan aprobable */}
          <div style={{ display: 'flex', gap: '2px', 'border-radius': '7px', border: '1px solid var(--border-window)', padding: '1px' }}>
            <button
              onClick={() => setMode('chat')}
              style={{
                ...modeBtn, color: mode() === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
                background: mode() === 'chat' ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
              }}
              title="Chat conversacional"
            >💬</button>
            <button
              onClick={() => setMode('plan')}
              style={{
                ...modeBtn, color: mode() === 'plan' ? 'var(--text-primary)' : 'var(--text-muted)',
                background: mode() === 'plan' ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
              }}
              title="Modo plan: propone → apruebas → ejecuta con diffs"
            >📋</button>
          </div>
          <Show when={sessionId()}>
            <span style={{ 'font-size': '9.5px', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 14%, transparent)', padding: '1px 6px', 'border-radius': '8px' }}>#{TAG}</span>
          </Show>
          <div style={{ flex: 1 }} />
          <button onClick={() => { pickSession(''); setMessages([]) }} style={miniBtn} className="yola-btn" title="Nueva sesión">➕</button>
          <button onClick={props.onClose} style={miniBtn} className="yola-btn" title="Cerrar panel (Ctrl+J)">✕</button>
        </div>

        {/* Sesiones (compartidas, con tag) */}
        <Show when={sessions().length > 1}>
          <div style={{
            display: 'flex', gap: '4px', padding: '4px 6px', 'border-bottom': '1px solid var(--border-window)',
            'flex-shrink': 0, 'overflow-x': 'auto', 'flex-wrap': 'wrap',
          }}>
            <For each={sessions().slice(-6).reverse()}>
              {(s) => (
                <div
                  onClick={() => pickSession(s.id)}
                  style={{
                    padding: '2px 7px', 'border-radius': '8px', cursor: 'pointer', 'font-size': '9.5px',
                    'font-family': 'monospace', 'white-space': 'nowrap',
                    background: s.id === sessionId() ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'var(--bg-window-header)',
                    border: '1px solid var(--border-window)',
                    color: s.id === sessionId() ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  title={`Sesión ${s.id?.slice(0, 8)}`}
                >
                  {s.tag || 'general'} {s.id === sessionId() ? '●' : ''}
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Mensajes */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', 'min-height': '0' }}>
          {/* ── Modo plan: todos del agente + aprobar ── */}
          <Show when={mode() === 'plan' && todos().length}>
            <div style={{ 'margin-bottom': '8px', 'border-radius': '8px', border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border-window))', padding: '7px', background: 'color-mix(in srgb, var(--accent) 5%, transparent)' }}>
              <div style={{ 'font-size': '10px', 'font-weight': 700, color: 'var(--accent)', 'margin-bottom': '4px', 'text-transform': 'uppercase', 'letter-spacing': '0.4px' }}>
                📋 Plan propuesto
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '3px' }}>
                <For each={todos()}>
                  {(t, i) => (
                    <div style={{ display: 'flex', gap: '6px', 'align-items': 'center', 'font-size': '10.5px', color: t.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      <span>{t.done ? '☑' : '☐'}</span>
                      <span style={{ 'text-decoration': t.done ? 'line-through' : 'none' }}>{t.title}</span>
                    </div>
                  )}
                </For>
              </div>
              <button
                onClick={() => send('', { approve: true })}
                disabled={sending()}
                style={{
                  ...miniBtn, 'margin-top': '6px', width: '100%',
                  color: 'var(--success)',
                  border: '1px solid color-mix(in srgb, var(--success) 45%, transparent)',
                  background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                }}
                className="yola-btn"
              >✅ Aprobar y ejecutar</button>
            </div>
          </Show>

          {/* ── Diffs de la ejecución (con revert individual) ── */}
          <Show when={diffs().length}>
            <div style={{ 'margin-bottom': '8px', 'border-radius': '8px', border: '1px solid color-mix(in srgb, var(--warning) 30%, var(--border-window))', padding: '7px', background: 'color-mix(in srgb, var(--warning) 4%, transparent)' }}>
              <div style={{ 'font-size': '10px', 'font-weight': 700, color: 'var(--warning)', 'margin-bottom': '4px', 'text-transform': 'uppercase', 'letter-spacing': '0.4px' }}>
                🩹 Cambios del agente ({diffs().length})
              </div>
              <div style={{ display: 'flex', 'flex-direction': 'column', gap: '5px' }}>
                <For each={diffs()}>
                  {(d) => (
                    <div style={{ border: '1px solid var(--border-window)', 'border-radius': '6px', overflow: 'hidden' }}>
                      <div style={{
                        display: 'flex', 'align-items': 'center', gap: '6px', padding: '3px 7px',
                        background: 'var(--bg-window-header)', 'font-size': '10px', 'font-family': 'monospace',
                      }}>
                        <span>✏️</span>
                        <span style={{ overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}>{d.path}</span>
                        <div style={{ flex: 1 }} />
                        <button
                          onClick={() => revertDiff(d)}
                          style={{ ...miniBtn, padding: '1px 7px', 'font-size': '9.5px', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)' }}
                          title="Restaurar el contenido anterior"
                        >↩ Revertir</button>
                      </div>
                      <div style={{ 'max-height': '90px', overflow: 'auto', padding: '4px 7px', 'font-size': '9.5px', 'line-height': '1.45', 'font-family': 'monospace', 'white-space': 'pre-wrap', 'word-break': 'break-all' }}>
                        <For each={diffLines(d.before, d.after)}>
                          {(ln) => (
                            <div style={{
                              color: ln.type === '+' ? 'var(--success)' : ln.type === '-' ? 'var(--danger)' : 'var(--text-muted)',
                            }}>{ln.type === '…' ? ln.text : `${ln.type} ${ln.text}`}</div>
                          )}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          <Show when={!messages().length}>
            <div style={{ 'font-size': '11px', color: 'var(--text-muted)', 'text-align': 'center', padding: '16px 4px', 'line-height': '1.6' }}>
              Pídele al agente que edite tu código.<br />
              <span style={{ 'font-size': '10px' }}>Contexto automático del archivo activo.<br />Con una selección, puedes pedir «mejora esto».</span>
            </div>
          </Show>
          <For each={messages()}>
            {(m) => (
              <div style={{ 'margin-bottom': '8px' }}>
                <div style={{
                  padding: '7px 9px', 'border-radius': '9px', 'font-size': '11.5px', 'line-height': '1.55',
                  'white-space': 'pre-wrap', 'word-break': 'break-word', 'font-family': m.role === 'user' ? 'var(--font)' : 'ui-monospace, Consolas, monospace',
                  background: m.role === 'user' ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--bg-window-header)',
                  border: '1px solid var(--border-window)',
                }}>
                  <Show when={m.role === 'agent' && m.pending && !m.text}>
                    <span style={{ color: 'var(--text-muted)' }}>Pensando…</span>
                  </Show>
                  {m.text}
                <Show when={m.role === 'agent' && m.pending && m.text}>
                  <span style={{ color: 'var(--text-muted)' }}>▍</span>
                </Show>
              </div>
              {/* Tool-calls del turno (el agente trabaja a la vista) */}
              <Show when={m.role === 'agent' && tools().length}>
                <div style={{ display: 'flex', 'flex-direction': 'column', gap: '3px', 'margin-top': '4px' }}>
                  <For each={tools()}>
                    {(t) => (
                      <div style={{
                        display: 'flex', 'align-items': 'center', gap: '6px', 'font-size': '10px',
                        padding: '3px 7px', 'border-radius': '6px',
                        background: t.status === 'run' ? 'color-mix(in srgb, var(--warning) 8%, transparent)'
                          : t.status === 'ok' ? 'color-mix(in srgb, var(--success) 8%, transparent)'
                          : 'color-mix(in srgb, var(--danger) 8%, transparent)',
                        border: '1px solid var(--border-window)',
                        'font-family': 'ui-monospace, Consolas, monospace',
                        color: t.status === 'run' ? 'var(--warning)'
                          : t.status === 'ok' ? 'var(--success)'
                          : 'var(--danger)',
                      }}>
                        <span>{toolIcon(t.name)}</span>
                        <span style={{ 'font-weight': 600 }}>{t.name}</span>
                        <Show when={t.args && typeof t.args === 'object'}>
                          <span style={{ color: 'var(--text-muted)', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'max-width': '130px' }} title={JSON.stringify(t.args)}>
                            {argBrief(t.args)}
                          </span>
                        </Show>
                        <span style={{ 'margin-left': 'auto', 'font-size': '9px' }}>
                          {t.status === 'run' ? '⏳' : t.status === 'ok' ? `✓${t.duration ? ` ${t.duration}ms` : ''}` : '✗'}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
              <Show when={m.role === 'agent' && !m.pending && extractCodeBlock(m.text) && props.getActiveFile?.()}>
                <button onClick={() => requestApply(m)} style={{
                  ...miniBtn, 'margin-top': '4px', color: 'var(--success)',
                  border: '1px solid color-mix(in srgb, var(--success) 40%, transparent)',
                }} className="yola-btn">💾 Aplicar al archivo…</button>
              </Show>
              </div>
            )}
          </For>
          <Show when={error()}>
            <div style={{ 'font-size': '10.5px', color: 'var(--danger)', padding: '4px' }}>{error()}</div>
          </Show>
        </div>

        {/* Input */}
        <div style={{ 'border-top': '1px solid var(--border-window)', padding: '6px', 'flex-shrink': '0' }}>
          <Show when={flashMsg()}>
            <div style={{ 'font-size': '10.5px', color: 'var(--success)', padding: '0 2px 4px' }}>{flashMsg()}</div>
          </Show>
          <Show when={attached()}>
            <div style={{
              display: 'flex', 'align-items': 'center', gap: '5px', padding: '3px 8px', 'margin-bottom': '5px',
              'border-radius': '7px', 'font-size': '10px', color: 'var(--accent)',
              background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            }}>
              <span>📎 selección adjunta</span>
              <span style={{ color: 'var(--text-secondary)' }}>({attached().size} caracteres)</span>
              <div style={{ flex: 1 }} />
              <span
                onClick={clearAttached}
                style={{ cursor: 'pointer', 'font-size': '10.5px', color: 'var(--text-secondary)' }}
                title="Quitar selección del prompt"
              >✕</span>
            </div>
          </Show>
          <textarea
            ref={inputRef}
            value={input()}
            className="yola-input"
            onInput={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send('', mode() === 'plan' ? { asPlan: true } : {}) }
              if (e.key === 'Escape') props.onClose()
            }}
            placeholder="Pregúntale al agente… (Enter envía, Shift+Enter salto)"
            rows="3"
            style={{
              width: '100%', 'box-sizing': 'border-box', padding: '6px 8px', resize: 'vertical',
              border: '1px solid var(--border-window)', 'border-radius': '7px',
              background: 'var(--bg-desktop)', color: 'var(--text-primary)', outline: 'none',
              'font-size': '11.5px', 'font-family': 'var(--font)', 'min-height': '48px',
            }}
          />
          <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-top': '5px' }}>
            <label style={{ 'font-size': '10px', color: 'var(--text-muted)', display: 'flex', 'align-items': 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeContext()}
                onChange={(e) => setIncludeContext(e.target.checked)}
                style={{ 'accent-color': 'var(--accent)' }}
              />
              contexto del archivo
            </label>
            <div style={{ flex: 1 }} />
            <Show when={streaming()}>
              <button onClick={stop} style={miniBtn} className="yola-btn" title="Detener">⏹ Detener</button>
            </Show>
            <button onClick={() => send('', mode() === 'plan' ? { asPlan: true } : {})} disabled={sending() || !input().trim()} className="yola-btn" style={{
              ...miniBtn, color: 'var(--text-primary)', background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
              border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)', opacity: sending() || !input().trim() ? 0.5 : 1,
            }}>Enviar</button>
          </div>
        </div>
      </div>

      {/* ── ApplyDialog: preview antes/después + confirmar ── */}
      <Show when={applyTarget()}>
        <div style={{
          position: 'absolute', inset: '0', zIndex: '60', background: 'var(--bg-overlay)',
          display: 'flex', 'align-items': 'center', 'justify-content': 'center',
        }} onClick={cancelApply}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '560px', 'max-width': '92%', background: 'var(--bg-window)',
              border: '1px solid var(--border-window)', 'border-radius': '10px',
              'box-shadow': 'var(--shadow)', padding: '12px', display: 'flex', 'flex-direction': 'column', gap: '8px',
            }}
          >
            <div style={{ 'font-size': '12.5px', 'font-weight': 600 }}>
              Aplicar cambio a {applyTarget().file}
              <Show when={applyTarget().hasSelection}>
                <span style={{ 'font-size': '10px', color: 'var(--accent)', 'margin-left': '6px' }}>(reemplaza la selección)</span>
              </Show>
              <Show when={!applyTarget().hasSelection}>
                <span style={{ 'font-size': '10px', color: 'var(--warning)', 'margin-left': '6px' }}>(reemplaza TODO el archivo)</span>
              </Show>
            </div>
            <div style={{ display: 'flex', gap: '8px', 'min-height': '180px', 'max-height': '300px' }}>
              <div style={{ flex: 1, 'min-width': 0 }}>
                <div style={{ 'font-size': '10px', color: 'var(--text-muted)', 'margin-bottom': '3px' }}>Antes</div>
                <pre style={{
                  margin: 0, padding: '7px', 'border-radius': '6px', 'font-size': '10.5px', 'line-height': '1.5',
                  background: 'var(--bg-desktop)', color: 'var(--text-secondary)', overflow: 'auto', 'max-height': '270px',
                  'font-family': 'ui-monospace, Consolas, monospace', 'white-space': 'pre-wrap', 'word-break': 'break-all',
                }}>{applyTarget().original.slice(0, 4000)}{applyTarget().original.length > 4000 ? '\n… (truncado)' : ''}</pre>
              </div>
              <div style={{ flex: 1, 'min-width': 0 }}>
                <div style={{ 'font-size': '10px', color: 'var(--success)', 'margin-bottom': '3px' }}>Después</div>
                <pre style={{
                  margin: 0, padding: '7px', 'border-radius': '6px', 'font-size': '10.5px', 'line-height': '1.5',
                  background: 'color-mix(in srgb, var(--success) 6%, var(--bg-desktop))', color: 'var(--text-primary)', overflow: 'auto', 'max-height': '270px',
                  'font-family': 'ui-monospace, Consolas, monospace', 'white-space': 'pre-wrap', 'word-break': 'break-all',
                }}>{applyTarget().proposed.slice(0, 4000)}{applyTarget().proposed.length > 4000 ? '\n… (truncado)' : ''}</pre>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', 'justify-content': 'flex-end' }}>
              <button onClick={cancelApply} style={miniBtn}>Cancelar</button>
              <button
                onClick={confirmApply}
                style={{
                  ...miniBtn,
                  color: applyTarget().hasSelection ? 'var(--success)' : 'var(--warning)',
                  border: `1px solid color-mix(in srgb, ${applyTarget().hasSelection ? 'var(--success)' : 'var(--warning)'} 45%, transparent)`,
                  background: `color-mix(in srgb, ${applyTarget().hasSelection ? 'var(--success)' : 'var(--warning)'} 12%, transparent)`,
                }}
              >💾 {applyTarget().hasSelection ? 'Escribir en disco' : 'Sobrescribir TODO el archivo'}</button>
            </div>
          </div>
        </div>
      </Show>
    </Show>
  )
}

const miniBtn = {
  padding: '3px 9px', 'min-height': '24px', cursor: 'pointer',
  border: '1px solid var(--border-window)', 'border-radius': '6px',
  background: 'transparent', color: 'var(--text-primary)',
  'font-size': '10.5px', 'font-family': 'var(--font)',
}

const modeBtn = {
  padding: '2px 7px', cursor: 'pointer', border: 'none', background: 'transparent',
  'font-size': '11px', 'font-family': 'var(--font)', 'border-radius': '5px',
}

function toolIcon(name) {
  if (!name) return '🛠'
  if (name.includes('bash') || name.includes('shell') || name.includes('term')) return '💻'
  if (name.includes('read') || name.includes('view')) return '📖'
  if (name.includes('write') || name.includes('edit') || name.includes('patch')) return '✏️'
  if (name.includes('glob') || name.includes('grep') || name.includes('search') || name.includes('find')) return '🔍'
  if (name.includes('fetch') || name.includes('web') || name.includes('browser')) return '🌐'
  if (name.includes('memory')) return '🧠'
  if (name.includes('skill')) return '📚'
  if (name.includes('todo')) return '✅'
  return '🛠'
}

function argBrief(args) {
  if (!args || typeof args !== 'object') return ''
  // muestra la ruta o el primer string útil del argumento
  const v = args.path || args.file || args.query || args.command || args.name || ''
  return String(v).slice(0, 60)
}

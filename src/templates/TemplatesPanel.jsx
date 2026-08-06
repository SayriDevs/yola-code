// ── YOLA Code — Panel de Templates ───────────────────────────
// Modal para crear proyectos desde plantillas. Se abre desde la
// paleta de comandos (Ctrl+P → "Nuevo desde template...").
// ──────────────────────────────────────────────────────────────
import { createSignal, For, Show, createMemo } from 'solid-js'
import { templates, generateTemplate, validateProjectName } from './index'

export function TemplatesPanel(props) {
  // props: { open, onClose, onGenerate, filesApi, workspace }
  const [step, setStep] = createSignal(0) // 0: elegir template, 1: nombre, 2: generando
  const [selected, setSelected] = createSignal(null)
  const [name, setName] = createSignal('')
  const [error, setError] = createSignal('')
  const [generating, setGenerating] = createSignal(false)

  const nameValid = createMemo(() => {
    if (!name().trim()) return { valid: false, error: '' }
    return validateProjectName(name())
  })

  const idSlug = createMemo(() => {
    return name().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'nuevo-proyecto'
  })

  function reset() {
    setStep(0)
    setSelected(null)
    setName('')
    setError('')
    setGenerating(false)
  }

  async function handleGenerate() {
    const v = nameValid()
    if (!v.valid) { setError(v.error); return }
    setGenerating(true)
    setError('')

    try {
      const files = generateTemplate(selected().id, name().trim())
      await props.onGenerate(files, selected())
      props.onClose?.()
      reset()
    } catch (e) {
      setError(e.message)
      setGenerating(false)
    }
  }

  // Reset al abrir/cerrar
  createMemo(() => {
    if (!props.open) reset()
  })

  // ── CSS inline (evita dependencia externa) ──
  const overlay = {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', 'z-index': 100,
    display: 'flex', 'align-items': 'center', 'justify-content': 'center',
  }
  const card = {
    background: 'var(--bg-window, #1e1e1e)',
    border: '1px solid var(--border-window, #444)',
    'border-radius': '8px',
    width: '480px', 'max-width': '90vw', 'max-height': '80vh',
    overflow: 'auto',
    'box-shadow': '0 8px 32px rgba(0,0,0,0.4)',
  }
  const header = {
    padding: '12px 16px', 'border-bottom': '1px solid var(--border-window, #444)',
    display: 'flex', 'align-items': 'center', 'justify-content': 'space-between',
    'font-size': '14px', 'font-weight': 600,
  }
  const body = { padding: '16px' }
  const btn = {
    padding: '6px 14px', 'border-radius': '4px', border: '1px solid var(--border-window, #444)',
    background: 'var(--bg-window-header, #2d2d2d)', color: 'var(--text-primary, #d4d4d4)',
    cursor: 'pointer', 'font-size': '12px',
  }
  const btnAccent = {
    ...btn, background: 'var(--accent, #0078d4)', 'border-color': 'var(--accent, #0078d4)',
    color: '#fff',
  }

  return (
    <Show when={props.open}>
      <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) props.onClose?.() }}>
        <div style={card}>
          {/* Header */}
          <div style={header}>
            <span>
              {step() === 0 ? 'Nuevo proyecto desde template' :
               step() === 1 ? `Crear: ${name() || '...'}` :
               'Generando...'}
            </span>
            <button style={{ ...btn, border: 'none', background: 'transparent', 'font-size': '16px' }}
              onClick={() => props.onClose?.()}>✕</button>
          </div>

          {/* Step 0: Elegir template */}
          <Show when={step() === 0}>
            <div style={body}>
              <div style={{ 'font-size': '12px', color: 'var(--text-muted, #888)', 'margin-bottom': '12px' }}>
                Elige una plantilla para empezar. Los archivos se crearán en el workspace actual.
              </div>
              <For each={templates}>
                {(tpl) => (
                  <div
                    onClick={() => { setSelected(tpl); setStep(1) }}
                    style={{
                      padding: '12px', 'border-radius': '6px', cursor: 'pointer',
                      border: '1px solid var(--border-window, #444)',
                      'margin-bottom': '8px',
                      transition: 'background 0.15s',
                      background: selected()?.id === tpl.id ? 'var(--accent-subtle, rgba(0,120,212,0.1))' : 'transparent',
                      ':hover': { background: 'var(--bg-window-header, #2d2d2d)' },
                    }}
                  >
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '10px' }}>
                      <span style={{ 'font-size': '24px' }}>{tpl.icon}</span>
                      <div>
                        <div style={{ 'font-size': '13px', 'font-weight': 600 }}>{tpl.name}</div>
                        <div style={{ 'font-size': '11px', color: 'var(--text-muted, #888)' }}>{tpl.description}</div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Step 1: Nombre */}
          <Show when={step() === 1 && selected()}>
            <div style={body}>
              <div style={{ 'font-size': '12px', color: 'var(--text-muted, #888)', 'margin-bottom': '12px' }}>
                Template: <strong>{selected().icon} {selected().name}</strong>
              </div>

              <div style={{ 'margin-bottom': '10px' }}>
                <label style={{ 'font-size': '12px', 'font-weight': 600, display: 'block', 'margin-bottom': '4px' }}>
                  Nombre del proyecto
                </label>
                <input
                  value={name()}
                  onInput={(e) => { setName(e.target.value); setError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && nameValid().valid) handleGenerate() }}
                  autofocus
                  placeholder="Mi proyecto"
                  style={{
                    width: '100%', padding: '8px 10px', 'border-radius': '4px',
                    border: `1px solid ${error() ? 'var(--danger, #e74c3c)' : 'var(--border-window, #444)'}`,
                    background: 'var(--bg-input, #1a1a1a)', color: 'var(--text-primary, #d4d4d4)',
                    'font-size': '13px', outline: 'none',
                    'box-sizing': 'border-box',
                  }}
                />
              </div>

              <Show when={name().trim()}>
                <div style={{
                  'font-size': '11px', color: 'var(--text-muted, #888)', 'margin-bottom': '10px',
                  padding: '6px 8px', background: 'var(--bg-input, #1a1a1a)', 'border-radius': '4px',
                }}>
                  ID: <code style={{ color: 'var(--accent, #0078d4)' }}>{idSlug()}</code>
                </div>
              </Show>

              <Show when={error()}>
                <div style={{ 'font-size': '11px', color: 'var(--danger, #e74c3c)', 'margin-bottom': '10px' }}>
                  {error()}
                </div>
              </Show>

              <div style={{ display: 'flex', gap: '8px', 'justify-content': 'flex-end' }}>
                <button style={btn} onClick={() => setStep(0)}>← Volver</button>
                <button
                  style={{ ...btnAccent, opacity: nameValid().valid ? 1 : 0.5, cursor: nameValid().valid ? 'pointer' : 'not-allowed' }}
                  disabled={!nameValid().valid || generating()}
                  onClick={handleGenerate}
                >
                  {generating() ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  )
}

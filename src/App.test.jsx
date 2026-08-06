// ── YOLA Code — tests del producto (UI real desde src) ───────
// El bundle se compila desde src — aquí montamos el componente real
// con Solid para verificar el flujo completo. jsdom como entorno.
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import { render } from 'solid-js/web'
import { createApp, mount } from './index.jsx'

function makeApi() {
  return {
    window: { setTitle: () => {} },
    os: {
      notify: vi.fn(),
      openApp: vi.fn(),
      getApps: () => [
        { id: 'yola-code', name: 'YOLA Code', manifest: { id: 'yola-code', version: '0.3.2', permissions: ['notify', 'openApp', 'files'] } },
      ],
    },
    params: {},
  }
}

let container
let dispose

beforeEach(() => {
  localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  dispose?.()
  container.remove()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const ta = () => container.querySelector('textarea')
const btnByText = (t) => [...container.querySelectorAll('button')].find(b => b.textContent.includes(t))

const openLocalFile = (name) => {
  // match EXACTO: .includes() matchearía el div raíz
  const item = [...container.querySelectorAll('div')].find(d => d.textContent.trim() === `📄 ${name}`)
  if (!item) throw new Error(`Archivo local "${name}" no encontrado`)
  item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

describe('YOLA Code (producto independiente)', () => {
  test('monta el shell en modo local sin daemon', () => {
    const Comp = createApp(makeApi())
    dispose = render(() => <Comp />, container)
    expect(container.textContent).toContain('YOLA Code')
    expect(container.textContent).toContain('modo local')
  })

  test('abrir archivo local muestra el editor con highlighting', () => {
    const Comp = createApp(makeApi())
    dispose = render(() => <Comp />, container)
    openLocalFile('README.md')
    expect(ta()).toBeTruthy()
    expect(ta().value).toContain('Bienvenido a YOLA Code')
  })

  test('editar guarda con debounce en localStorage', async () => {
    const Comp = createApp(makeApi())
    dispose = render(() => <Comp />, container)
    openLocalFile('README.md')
    ta().value = 'contenido nuevo'
    ta().dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(r => setTimeout(r, 1000))
    const saved = JSON.parse(localStorage.getItem('yola-code.files'))
    expect(saved['README.md']).toBe('contenido nuevo')
  })

  test('Preguntar a YOLA: abre el panel del agente (sin clipboard)', async () => {
    const api = makeApi()
    const Comp = createApp(api)
    dispose = render(() => <Comp />, container)
    openLocalFile('README.md')
    const writeText = vi.fn()
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    btnByText('💬').click()
    await new Promise(r => setTimeout(r, 20))
    // el panel del agente se abre (textarea del prompt + placeholder)
    const panels = [...container.querySelectorAll('textarea')]
    expect(panels.length).toBeGreaterThanOrEqual(2) // editor + prompt del agente
    expect(panels.some(t => t.placeholder.includes('Pregúntale al agente'))).toBe(true)
    // ya no copia al portapapeles ni abre el chat del OS
    expect(writeText).not.toHaveBeenCalled()
    expect(api.os.openApp).not.toHaveBeenCalled()
  })

  test('paleta de comandos: nuevo archivo', () => {
    const Comp = createApp(makeApi())
    dispose = render(() => <Comp />, container)
    vi.spyOn(window, 'prompt').mockReturnValue('nuevo.md')
    btnByText('☰').click()
    const item = [...container.querySelectorAll('div')].find(d => d.textContent.trim() === '➕Nuevo archivo…')
    expect(item).toBeTruthy()
    item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(ta()).toBeTruthy()
    expect(ta().value).toBe('')
  })
})

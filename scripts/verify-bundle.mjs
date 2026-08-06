// ── Verificación TDZ del bundle real (jsdom) ─────────────────
// Reproduce EXACTAMENTE lo que hace el OS: import dinámico del bundle
// + montaje. Si el bundle tuviera "Cannot access X before
// initialization", esto lo explota aquí y no en el escritorio del
// usuario. Uso: node scripts/verify-bundle.js
// ──────────────────────────────────────────────────────────────
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!DOCTYPE html><div id="app"></div>', {
  url: 'http://localhost:5173/',
  runScripts: 'outside-only',
})

// globales que el bundle espera (lo mínimo para montar en jsdom)
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.localStorage = dom.window.localStorage
globalThis.AbortController = dom.window.AbortController
globalThis.AbortSignal = dom.window.AbortSignal

try {
  const mod = await import('file:///D:/Workspace%20Miaw/CUERPOS_YOLA/yola-code/dist/app.js')
  const api = {
    window: { setTitle: () => {} },
    os: {
      notify: () => {},
      openApp: () => {},
      getApps: () => [{ id: 'yola-code', name: 'YOLA Code', manifest: { id: 'yola-code', version: '0.5.1' } }],
    },
    params: {},
  }
  const Comp = mod.createApp(api)
  const mount = mod.mount
  if (typeof mount === 'function') {
    mount(api, document.getElementById('app'))
  } else {
    // render manual
    const { render } = await import('solid-js/web')
    render(() => Comp(), document.getElementById('app'))
  }
  // forzar un tick de Solid (efectos corren)
  await new Promise(r => setTimeout(r, 100))
  const text = document.getElementById('app').textContent
  if (text.includes('YOLA Code')) {
    console.log('VERIFIED: bundle monta sin TDZ — la app renderiza')
  } else {
    console.log('FAIL: el bundle no renderizó (¿error silencioso?)')
  }
} catch (e) {
  console.log(`TDZ/ERROR EN BUNDLE: ${e.message}`)
  process.exit(1)
}

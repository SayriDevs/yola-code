// ── YOLA Code — entry del bundle (lo que el OS importa) ─────
// El MISMO bundle sirve a dos anfitriones:
//   - YOLA OS:   createApp(api)   (el App Store lo importa)
//   - Desktop:   mount(api, el)   (el .exe lo monta en su ventana)
import { render } from 'solid-js/web'
import { createApp } from './App.jsx'

export { createApp }

export function mount(api, el) {
  const Comp = createApp(api)
  render(() => <Comp />, el)
}

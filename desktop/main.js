// ── YolaCode Desktop — main: monta el MISMO bundle con el api local ──
// Importa del build de Vite (dist/app.js), servido por Tauri vía frontendDist
import { mount } from '../dist/app.js'
import { buildDesktopApi } from './api.js'

const api = await buildDesktopApi()
mount(api, document.getElementById('app'))

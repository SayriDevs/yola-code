// ── YOLA Code — Terminal xterm.js ─────────────────────────────
// Terminal real con soporte PTY vía WebSocket al daemon. xterm.js
// provee escape sequences, colores ANSI, Ctrl+C, resize, etc.
//
// Modos:
//   - ws: WebSocket al daemon (PTY real, launcher integrado)
//   - cmd: POST /api/v1/terminal/exec (fallback sin PTY, por comando)
// ──────────────────────────────────────────────────────────────
import { createSignal, createEffect, onCleanup, onMount, Show } from 'solid-js'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

// Tema oscuro que matchea el editor
const XTERM_THEME = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#ffffff',
  cursorAccent: '#1e1e1e',
  selectionBackground: '#264f78',
  black: '#000000',
  red: '#cd3131',
  green: '#0dbc79',
  yellow: '#e5e510',
  blue: '#2472c8',
  magenta: '#bc3fbc',
  cyan: '#11a8cd',
  white: '#e5e5e5',
  brightBlack: '#666666',
  brightRed: '#f14c4c',
  brightGreen: '#23d18b',
  brightYellow: '#f5f543',
  brightBlue: '#3b8eea',
  brightMagenta: '#d670d6',
  brightCyan: '#29b8db',
  brightWhite: '#ffffff',
}

export function XtermPanel(props) {
  // props: { daemonUrl, cwd, onClose, open }
  let containerRef
  let term = null
  let fitAddon = null
  let ws = null
  const [mode, setMode] = createSignal('loading') // 'loading' | 'pty' | 'cmd'

  // ── Modo PTY (WebSocket) ──
  function connectPty() {
    const url = (props.daemonUrl || 'http://localhost:7779')
      .replace('http', 'ws')
      .replace(/\/$/, '') + '/api/v1/terminal/pty'

    const params = new URLSearchParams()
    if (props.cwd) params.set('cwd', props.cwd)

    const wsUrl = url + (params.toString() ? '?' + params.toString() : '')

    try {
      ws = new WebSocket(wsUrl)
    } catch {
      setMode('cmd')
      return
    }

    ws.onopen = () => {
      setMode('pty')
      if (term) {
        term.clear()
        term.writeln('\x1b[1;32m▸ Terminal conectada (PTY)\x1b[0m')
        term.writeln('')
      }
    }

    ws.onmessage = (ev) => {
      if (term) term.write(ev.data)
    }

    ws.onerror = () => {
      setMode('cmd')
    }

    ws.onclose = () => {
      if (term) term.writeln('\r\n\x1b[1;33m▸ Conexión cerrada\x1b[0m')
      if (ws) { ws = null }
    }
  }

  // ── Inicializar xterm ──
  onMount(() => {
    if (!containerRef) return

    term = new Terminal({
      theme: XTERM_THEME,
      fontSize: 13,
      fontFamily: 'ui-monospace, Consolas, "Cascadia Code", monospace',
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 5000,
      tabStopWidth: 2,
      convertEol: true,
    })

    fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef)

    // Intentar PTY, fallback a modo comando
    connectPty()

    // Si no hay PTY tras timeout corto, modo comando
    const t = setTimeout(() => {
      if (mode() === 'loading') {
        setMode('cmd')
        term.writeln('\x1b[1;33m▸ Modo comando (sin PTY). Escribe comandos y presiona Enter.\x1b[0m')
        term.writeln('')
        term.write('$ ')
      }
    }, 1500)

    // Input del usuario
    let cmdBuffer = ''
    const history = []
    let histIdx = 0

    term.onData((data) => {
      const code = data.charCodeAt(0)

      if (mode() === 'pty' && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data)
        return
      }

      // Modo comando (fallback)
      if (code === 13 /* Enter */) {
        term.write('\r\n')
        const cmd = cmdBuffer.trim()
        cmdBuffer = ''
        if (cmd) {
          history.unshift(cmd)
          if (history.length > 100) history.pop()
          histIdx = -1
          execCommand(cmd)
        } else {
          term.write('$ ')
        }
        return
      }

      if (code === 127 /* Backspace */) {
        if (cmdBuffer.length > 0) {
          cmdBuffer = cmdBuffer.slice(0, -1)
          term.write('\b \b')
        }
        return
      }

      if (code === 3 /* Ctrl+C */) {
        term.write('^C\r\n$ ')
        cmdBuffer = ''
        return
      }

      // Flechas (secuencias de escape)
      if (data === '\x1b[A') { // Up
        if (history.length > 0 && histIdx < history.length - 1) {
          histIdx++
          while (cmdBuffer.length > 0) { term.write('\b \b'); cmdBuffer = cmdBuffer.slice(0, -1) }
          cmdBuffer = history[histIdx]
          term.write(cmdBuffer)
        }
        return
      }
      if (data === '\x1b[B') { // Down
        if (histIdx >= 0) {
          histIdx--
          while (cmdBuffer.length > 0) { term.write('\b \b'); cmdBuffer = cmdBuffer.slice(0, -1) }
          cmdBuffer = histIdx >= 0 ? history[histIdx] : ''
          term.write(cmdBuffer)
        }
        return
      }

      // Caracter normal
      if (data >= ' ') {
        cmdBuffer += data
        term.write(data)
      }
    })

    // Resize observer
    fitAddon.fit()
    const onResize = () => fitAddon.fit()
    const observer = new ResizeObserver(onResize)
    observer.observe(containerRef)

    onCleanup(() => {
      clearTimeout(t)
      observer.disconnect()
      if (term) { term.dispose(); term = null }
      if (ws) { ws.close(); ws = null }
    })
  })

  async function execCommand(cmd) {
    try {
      const res = await fetch(`${props.daemonUrl}/api/v1/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, cwd: props.cwd || undefined }),
      })

      if (!res.ok) {
        const t = await res.text().catch(() => '')
        term.writeln(`\x1b[1;31mError ${res.status}: ${t.slice(0, 200)}\x1b[0m`)
      } else {
        const data = await res.json()
        if (data.stdout) term.write(data.stdout)
        if (data.stderr) term.write(`\x1b[1;31m${data.stderr}\x1b[0m`)
      }
    } catch (e) {
      term.writeln(`\x1b[1;31m${e.message}\x1b[0m`)
    }
    term.write('$ ')
  }

  // Refocus al abrir/cerrar
  createEffect(() => {
    if (props.open && term) {
      setTimeout(() => term.focus(), 50)
    }
  })

  return (
    <div style={{ width: '100%', height: '100%', background: '#1e1e1e' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

// ── YOLA Code — Mini-cliente del contrato del agente (bridge) ──
// Mismo contrato que yola-client-ts (usado por el Chat del OS):
//   POST   /api/v1/sessions               → crea sesión
//   GET    /api/v1/sessions               → lista sesiones
//   POST   /api/v1/sessions/{id}/prompt   → SSE streaming
//   DELETE /api/v1/sessions/{id}
// Cero dependencias externas — habla directo con el daemon.
// ──────────────────────────────────────────────────────────────
import { parseSseLine } from './sse'

export function createAgentClient(baseUrl) {
  return {
    baseUrl,

    async createSession(opts = {}) {
      const res = await fetch(`${baseUrl}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'yola-chat',
          model: 'deepseek-v4-flash-free',
          provider: 'opencode',
          ...opts,
        }),
      })
      if (!res.ok) {
        let t = ''
        try { t = await res.text() } catch { /* noop */ }
        throw new Error(`sessions HTTP ${res.status}: ${t}`)
      }
      return res.json()
    },

    async listSessions() {
      const res = await fetch(`${baseUrl}/api/v1/sessions`)
      if (!res.ok) throw new Error(`sessions HTTP ${res.status}`)
      return res.json()
    },

    async deleteSession(id) {
      const res = await fetch(`${baseUrl}/api/v1/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`sessions DELETE HTTP ${res.status}`)
    },

    /// Envía un prompt y emite el stream en vivo.
    /// callbacks: { onToken(text), onToolCall(ev), onToolResult(ev), onDone(), onError(err), signal }
    async sendPrompt(sessionId, prompt, { onToken, onToolCall, onToolResult, onDone, onError, signal } = {}) {
      let res
      try {
        res = await fetch(`${baseUrl}/api/v1/sessions/${encodeURIComponent(sessionId)}/prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal,
        })
      } catch (e) {
        if (e.name === 'AbortError') { onDone?.(); return }
        onError?.(e)
        return
      }
      if (!res.ok) {
        let t = ''
        try { t = await res.text() } catch { /* noop */ }
        onError?.(new Error(`prompt HTTP ${res.status}: ${t}`))
        return
      }
      const reader = res.body?.getReader()
      if (!reader) { onError?.(new Error('sin stream de lectura')); return }

      const decoder = new TextDecoder()
      let buffer = ''
      try {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            const parsed = parseSseLine(line)
            if (!parsed) continue
            if (parsed.done) { onDone?.(); return }
            const ev = parsed.event
            if (ev.type === 'token' || ev.type === 'reasoning') onToken?.(ev.text)
            else if (ev.type === 'tool_call') onToolCall?.(ev)
            else if (ev.type === 'tool_result') onToolResult?.(ev)
            else if (ev.type === 'error') onError?.(new Error(ev.text || 'error del agente'))
          }
        }
        onDone?.()
      } catch (e) {
        if (e.name === 'AbortError') onDone?.()
        else onError?.(e)
      }
    },
  }
}

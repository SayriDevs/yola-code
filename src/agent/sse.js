// ── YOLA Code — Utilidades puras del agente (SSE, bloques de código) ──
// Mismo contrato que yola-client-ts: POST /api/v1/sessions/{id}/prompt
// devuelve un stream SSE con eventos `data: {json}` y `[DONE]`.
// ──────────────────────────────────────────────────────────────

/// Parsea una línea SSE. Devuelve:
///   { done: true }            — `[DONE]`
///   { event: {...} }          — JSON válido
///   null                      — ruido/línea no-`data:`
export function parseSseLine(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('data: ')) return null
  const data = trimmed.slice(6)
  if (data === '[DONE]') return { done: true }
  try {
    return { event: JSON.parse(data) }
  } catch {
    return null
  }
}

/// Extrae el primer bloque de código fenced de un texto.
/// Devuelve { lang, code } o null.
export function extractCodeBlock(text) {
  const m = text.match(/```([\w+-]*)[ \t]*\n?([\s\S]*?)```/)
  if (!m) return null
  return { lang: m[1] || '', code: m[2].replace(/\n$/, '') }
}

/// Convierte una lista de eventos en el texto acumulado (token/reasoning).
export function accumulateText(events) {
  let out = ''
  for (const e of events) {
    if (e.type === 'token' || e.type === 'reasoning') out += e.text
    else if (e.data !== undefined && typeof e.data === 'string') out += e.data
  }
  return out
}

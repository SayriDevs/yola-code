// ── YOLA Code — Lógica del Agent Mode (plan visible + diffs) ──
// Funciones PURAS — el agente propone un plan como checklist
// markdown (estándar), YolaCode lo parsea a tarjetas. Los diffs se
// calculan sobre disco (antes/después de cada write del agente).
// ──────────────────────────────────────────────────────────────

/// Parsea un checklist markdown a items. Formatos aceptados:
///   - [ ] tarea · - [x] tarea · ☐ tarea · ☑ tarea · ✓ tarea · □ tarea
/// Devuelve [{ title, done }] o [] si no hay checklist.
export function parseChecklist(text) {
  if (!text) return []
  const items = []
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*(?:[-*]?\s*)?(?:\[([ xX])\]\s*|([☐□○])\s*|([☑✓✔])\s*)(.+)$/)
    if (m) {
      const done = m[1] ? m[1].toLowerCase() === 'x' : !!(m[3])
      const title = (m[2] || m[3]) ? (m[4] || '').trim() : (m[4] || '').trim()
      items.push({ title, done })
    } else {
      // líneas sueltas tipo "- Tarea" (sin checkbox) también cuentan como plan
      const bare = line.match(/^\s*[-*]\s+(.+)$/)
      if (bare && items.length === 0) items.push({ title: bare[1].trim(), done: false })
    }
  }
  return items
}

/// Diff por líneas (LCS simplificado — suficiente para UI):
/// devuelve [{ type: ' '|'+'|'-', text }]
export function diffLines(before, after) {
  // '' no es una línea vacía: es CERO líneas (un '-' fantasma rompe el diff)
  const a = before ? String(before).split('\n') : []
  const b = after ? String(after).split('\n') : []
  const out = []
  const max = Math.max(a.length, b.length)
  for (let i = 0; i < max; i++) {
    if (i < a.length && i < b.length) {
      out.push(a[i] === b[i] ? { type: ' ', text: a[i] } : { type: '-', text: a[i] })
      if (a[i] !== b[i]) out.push({ type: '+', text: b[i] })
    } else if (i < a.length) {
      out.push({ type: '-', text: a[i] })
    } else {
      out.push({ type: '+', text: b[i] })
    }
  }
  // líneas iguales consecutivas → colapsar a un solo "…" (límite de muestra)
  const MAX_SHOW = 40
  if (out.length > MAX_SHOW) {
    const first = out.slice(0, 18)
    const last = out.slice(-18)
    return [...first, { type: '…', text: `… ${out.length - 36} líneas más …` }, ...last]
  }
  return out
}

/// ¿La tool del agente modifica archivos? (write/edit/apply_patch)
export function isFileWritingTool(name) {
  return !!name && /^(write|edit|apply_patch|patch|create)$/i.test(name)
}

/// Extrae el path del argumento de la tool.
export function toolPath(args) {
  if (!args || typeof args !== 'object') return null
  return args.path || args.file || null
}

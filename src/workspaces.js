// ── YOLA Code — Workspaces (sincronización con el OS + persistencia) ──
// Cuando YolaCode corre como app nativa del YOLA OS, detecta los
// workspaces abiertos en el si-yola (vía /api/v1/workspaces del daemon)
// y los combina con los locales. La lista se persiste en localStorage:
// si luego el usuario corre el .exe standalone (con su bridge o ninguno),
// los workspaces del OS siguen disponibles.
// ──────────────────────────────────────────────────────────────

const KEY = 'yola-code.workspaces'

export function loadLocalWorkspaces() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalWorkspaces(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch { /* quota */ }
}

/// Lista los workspaces abiertos en el daemon (los del si-yola).
export async function fetchOsWorkspaces(daemonUrl) {
  if (!daemonUrl) return []
  try {
    const res = await fetch(`${daemonUrl}/api/v1/workspaces`)
    if (!res.ok) return []
    const list = await res.json()
    return (Array.isArray(list) ? list : [])
      .filter(w => w?.root)
      .map(w => ({
        id: w.id || 'os-ws',
        root: String(w.root),
        name: w.metadata?.name || '',
        source: 'os',
      }))
  } catch {
    return [] // sin daemon o daemon caído — solo locales
  }
}

/// Combina workspaces del OS con los locales (dedupe por root).
/// Los del OS van primero; los locales que ya no existen en el OS
/// se conservan (el .exe los necesita). Devuelve { merged, added }.
export function mergeWorkspaces(osList, localList) {
  const byRoot = new Map()
  for (const w of localList) byRoot.set(normalize(w.root), { ...w })
  let added = 0
  for (const w of osList) {
    const key = normalize(w.root)
    if (!byRoot.has(key)) { added++; byRoot.set(key, { ...w, addedAt: Date.now() }) }
    else if (byRoot.get(key).source !== 'os') {
      // el mismo workspace ahora viene del OS: actualizar el origen
      byRoot.set(key, { ...w, addedAt: byRoot.get(key).addedAt || Date.now() })
    }
  }
  const merged = [...byRoot.values()].sort((a, b) => {
    if ((a.source === 'os') !== (b.source === 'os')) return a.source === 'os' ? -1 : 1
    return (b.addedAt || 0) - (a.addedAt || 0)
  })
  return { merged, added }
}

/// Normaliza una ruta para dedupe (Windows: case-insensitive, sin trailing \)
export function normalize(root) {
  return String(root || '').replace(/[\\/]+$/, '').toLowerCase()
}

export function workspaceLabel(w) {
  return w.name || w.root.split(/[\\/]/).pop() || w.root
}

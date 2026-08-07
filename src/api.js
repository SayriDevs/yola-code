// ── YOLA Code — Capa de archivos (workspace real + fallback) ─
// Si el OS expone api.os.files (permiso `files`), la app edita el
// workspace REAL del motor. Sin daemon/permiso → modo local
// (localStorage) para no morir nunca.
// ──────────────────────────────────────────────────────────────

const LS_KEY = 'yola-code.files'
const WS_KEY = 'yola-code.workspace'

const DEFAULT_FILES = {
  'README.md': `# Bienvenido a YOLA Code

El editor nativo de YOLA — mejor que Cursor, mejor que Codex,
mejor que Antigravity: vive en un OS cuyo kernel es el agente.

## Lo que puedes hacer
- Ctrl+P — paleta de comandos
- Ctrl+F — buscar en el archivo
- Ctrl+S — guardar (workspace real vía api.os.files)
- ✨ Mejorar con YOLA — selecciona código y pídele al agente
- ☰ — cambiar de workspace (ruta real en tu máquina)

## ¿Workspace real o local?
Sin daemon: editas aquí (localStorage). Con daemon + permiso
files: editas tu código REAL en disco.
`,
  'ideas.md': `# Ideas

- [ ] Syntax highlighting ✓ (ya)
- [ ] Tabs múltiples ✓ (ya)
- [ ] Explorador de workspace real ✓ (ya)
- [ ] Paleta de comandos ✓ (ya)
- [ ] Agente integrado que edita el archivo por ti
- [ ] Terminal dentro de la app
`,
}

export function loadLocalFiles() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupto */ }
  return { ...DEFAULT_FILES }
}

export function saveLocalFiles(files) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(files))
  } catch { /* quota */ }
}

export function loadWorkspacePath() {
  try {
    return localStorage.getItem(WS_KEY) || ''
  } catch {
    return ''
  }
}

export function saveWorkspacePath(p) {
  try {
    localStorage.setItem(WS_KEY, p)
  } catch { /* quota */ }
}

/** Resuelve si hay API de files real (daemon + permiso) */
export function hasFilesApi(api) {
  return !!(api?.os?.files && api?.os?.daemonUrl)
}

/**
 * filesApi PROPIO de YolaCode — habla el contrato REAL del daemon
 * (verificado en disco): GET /api/v1/files?directory&path, NO
 * /files/list (ruta inexistente → 404 sin ACAO → el browser lo reporta
 * como CORS). Así YolaCode funciona igual en el OS y en el .exe, sin
 * depender del filesApi que el anfitrión provea.
 */
export function buildYolaFilesApi(daemonUrl) {
  const base = `${daemonUrl}/api/v1`
  const q = (obj) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null && v !== '') p.set(k, v)
    }
    return p.size ? '?' + p.toString() : ''
  }
  return {
    list: async (directory = '', path = '') => {
      const res = await fetch(`${base}/files${q({ directory, path })}`)
      if (!res.ok) throw new Error(`files HTTP ${res.status}`)
      const data = await res.json()
      // el daemon devuelve { entries: [...] } — NUNCA asumir un formato sin
      // verificar (esto enmascaró el bug como "Vacío" silencioso)
      if (Array.isArray(data)) return data
      if (Array.isArray(data?.entries)) return data.entries
      throw new Error('files: formato de respuesta inesperado')
    },
    read: async (path) => {
      const res = await fetch(`${base}/files/content${q({ path })}`)
      if (!res.ok) throw new Error(`files/content HTTP ${res.status}`)
      const data = await res.json()
      return data.content
    },
    write: async (path, content) => {
      const res = await fetch(`${base}/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      })
      if (!res.ok) throw new Error(`files/write HTTP ${res.status}`)
    },
    create: async (path, type = 'file') => {
      const res = await fetch(`${base}/files/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type }),
      })
      if (!res.ok) throw new Error(`files/create HTTP ${res.status}`)
    },
    remove: async (path) => {
      const res = await fetch(`${base}/files/delete${q({ path })}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`files/delete HTTP ${res.status}`)
    },
    status: async (path) => {
      const res = await fetch(`${base}/files/status${q({ path })}`)
      if (!res.ok) throw new Error(`files/status HTTP ${res.status}`)
      return res.json()
    },
  }
}

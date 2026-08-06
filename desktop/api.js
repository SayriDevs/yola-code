// ── YolaCode Desktop — api del anfitrión ────────────────────
// Sin duplicación de daemons:
//   1. ¿El daemon del SISTEMA responde en :7779? → se usa ESE.
//   2. ¿No? → el daemon EMBEBIDO en :7791 (lanzado por Rust).
//   3. ¿Ninguno? → files undefined → la app cae a modo local.
// La UI no sabe qué daemon usa — solo conoce este api.
// ──────────────────────────────────────────────────────────────

const SYSTEM_DAEMON = 'http://localhost:7779'
const EMBEDDED_DAEMON = 'http://localhost:7791'

async function healthCheck(url) {
  try {
    const res = await fetch(`${url}/global/health`, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

function filesApi(baseUrl) {
  return {
    list: async (directory = '', path = '') => {
      const q = new URLSearchParams()
      if (directory) q.set('directory', directory)
      if (path) q.set('path', path)
      const res = await fetch(`${baseUrl}/api/v1/files/list${q.size ? '?' + q : ''}`)
      if (!res.ok) throw new Error(`files/list HTTP ${res.status}`)
      return res.json()
    },
    read: async (path) => {
      const res = await fetch(`${baseUrl}/api/v1/files/content?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error(`files/content HTTP ${res.status}`)
      const data = await res.json()
      return data.content
    },
    write: async (path, content) => {
      const res = await fetch(`${baseUrl}/api/v1/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      })
      if (!res.ok) throw new Error(`files/write HTTP ${res.status}`)
    },
    create: async (path, type = 'file') => {
      const res = await fetch(`${baseUrl}/api/v1/files/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type }),
      })
      if (!res.ok) throw new Error(`files/create HTTP ${res.status}`)
    },
    remove: async (path) => {
      const res = await fetch(`${baseUrl}/api/v1/files/delete?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`files/delete HTTP ${res.status}`)
    },
    status: async (path) => {
      const res = await fetch(`${baseUrl}/api/v1/files/status?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error(`files/status HTTP ${res.status}`)
      return res.json()
    },
  }
}

export async function buildDesktopApi() {
  // 1) sistema → 2) embebido → 3) ninguno (modo local)
  let baseUrl = null
  if (await healthCheck(SYSTEM_DAEMON)) {
    baseUrl = SYSTEM_DAEMON
    console.log('[yola-code-desktop] usando el daemon del sistema (:7779)')
  } else if (await healthCheck(EMBEDDED_DAEMON)) {
    baseUrl = EMBEDDED_DAEMON
    console.log('[yola-code-desktop] usando el daemon embebido (:7791)')
  } else {
    console.log('[yola-code-desktop] sin daemon — modo local')
  }

  return {
    window: {
      setTitle: (t) => { document.title = t || 'YOLA Code' },
    },
    os: {
      get daemonUrl() { return baseUrl }, // para el panel del agente (mismo daemon que los archivos)
      notify: (msg, type = 'info') => {
        console.log(`[${type}] ${msg}`)
      },
      openApp: (appId) => {
        console.log(`[openApp] ${appId}`)
      },
      getApps: () => [
        { id: 'yola-code', name: 'YOLA Code', manifest: { id: 'yola-code', name: 'YOLA Code', version: '0.5.1' } },
      ],
      // files SOLO si hay daemon — si no, la app cae a modo local
      ...(baseUrl ? { files: filesApi(baseUrl) } : {}),
    },
    params: {},
  }
}

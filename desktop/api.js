// ── YolaCode Desktop — api del anfitrión ────────────────────
// Dos modos, un solo puerto (:7779):
//   1. YOLA OS corriendo → el daemon YA está en :7779 → se usa ESE.
//   2. Standalone → Tauri lanzó yola-daemon en :7779 → se usa ESE.
// La UI no sabe en qué modo está — solo conoce este api.
// ──────────────────────────────────────────────────────────────

const DAEMON_URL = 'http://localhost:7779'

async function healthCheck() {
  try {
    const res = await fetch(`${DAEMON_URL}/global/health`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

function filesApi() {
  return {
    list: async (directory = '', path = '') => {
      const q = new URLSearchParams()
      if (directory) q.set('directory', directory)
      if (path) q.set('path', path)
      const res = await fetch(`${DAEMON_URL}/api/v1/files/list${q.size ? '?' + q : ''}`)
      if (!res.ok) throw new Error(`files/list HTTP ${res.status}`)
      return res.json()
    },
    read: async (path) => {
      const res = await fetch(`${DAEMON_URL}/api/v1/files/content?path=${encodeURIComponent(path)}`)
      if (!res.ok) throw new Error(`files/content HTTP ${res.status}`)
      const data = await res.json()
      return data.content
    },
    write: async (path, content) => {
      const res = await fetch(`${DAEMON_URL}/api/v1/files/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
      })
      if (!res.ok) throw new Error(`files/write HTTP ${res.status}`)
    },
    create: async (path, type = 'file') => {
      const res = await fetch(`${DAEMON_URL}/api/v1/files/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type }),
      })
      if (!res.ok) throw new Error(`files/create HTTP ${res.status}`)
    },
    delete: async (path) => {
      const res = await fetch(`${DAEMON_URL}/api/v1/files/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      if (!res.ok) throw new Error(`files/delete HTTP ${res.status}`)
    },
    rename: async (oldPath, newPath) => {
      const res = await fetch(`${DAEMON_URL}/api/v1/files/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
      })
      if (!res.ok) throw new Error(`files/rename HTTP ${res.status}`)
    },
    exists: async (path) => {
      const res = await fetch(`${DAEMON_URL}/api/v1/files/stat?path=${encodeURIComponent(path)}`)
      return res.ok
    },
  }
}

export async function buildDesktopApi() {
  const daemonOk = await healthCheck()

  return {
    window: {
      setTitle: (title) => {
        document.title = title || 'YOLA Code'
      },
    },
    os: {
      daemonUrl: DAEMON_URL,
      daemonOk,
      notify: (msg, type) => {
        console.log(`[YolaCode ${type || 'info'}] ${msg}`)
      },
      openApp: (id) => {
        console.log(`[YolaCode] openApp: ${id}`)
      },
      getApps: () => [],
      files: daemonOk ? filesApi() : undefined,
    },
    params: {},
  }
}

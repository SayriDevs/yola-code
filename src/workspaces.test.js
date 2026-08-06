// ── YOLA Code — Tests de workspaces ───────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadLocalWorkspaces, saveLocalWorkspaces, fetchOsWorkspaces, mergeWorkspaces, normalize, workspaceLabel } from './workspaces'

beforeEach(() => {
  localStorage.clear()
})

describe('mergeWorkspaces', () => {
  it('dedupe por root (case-insensitive) y los del OS van primero', () => {
    const os = [{ id: 'a', root: 'C:\\proj\\os', source: 'os' }]
    const local = [{ id: 'l', root: 'c:\\proj\\os', source: 'local', addedAt: 1 }] // mismo root
    const { merged, added } = mergeWorkspaces(os, local)
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('os')
    expect(added).toBe(0)
  })

  it('conserva los locales que no están en el OS (para el .exe)', () => {
    const os = [{ id: 'a', root: 'C:\\proj\\os', source: 'os' }]
    const local = [{ id: 'l', root: 'D:\\otro', source: 'local', addedAt: 5 }]
    const { merged, added } = mergeWorkspaces(os, local)
    expect(merged).toHaveLength(2)
    expect(merged.map(w => w.source).sort()).toEqual(['local', 'os'])
    expect(added).toBe(1) // el workspace del OS es nuevo respecto a los locales
  })

  it('cuenta los nuevos detectados del OS', () => {
    const os = [{ id: 'a', root: 'C:\\nuevo', source: 'os' }]
    const { merged, added } = mergeWorkspaces(os, [])
    expect(added).toBe(1)
    expect(merged[0].root).toBe('C:\\nuevo')
  })
})

describe('persistencia', () => {
  it('round-trip en localStorage', () => {
    saveLocalWorkspaces([{ root: 'C:\\x', source: 'local' }])
    expect(loadLocalWorkspaces()).toEqual([{ root: 'C:\\x', source: 'local' }])
  })

  it('tolera datos corruptos', () => {
    localStorage.setItem('yola-code.workspaces', 'no-json')
    expect(loadLocalWorkspaces()).toEqual([])
  })
})

describe('fetchOsWorkspaces', () => {
  it('filtra entradas sin root y normaliza el formato', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        { id: 'w1', root: 'C:\\proj\\a', metadata: { name: 'Proyecto A' } },
        { id: 'w2', root: null },
        { root: 'D:\\sin-id' },
      ],
    })))
    const list = await fetchOsWorkspaces('http://localhost:7779')
    expect(list).toHaveLength(2)
    expect(list[0]).toMatchObject({ id: 'w1', root: 'C:\\proj\\a', name: 'Proyecto A', source: 'os' })
    vi.unstubAllGlobals()
  })

  it('devuelve [] sin daemon', async () => {
    expect(await fetchOsWorkspaces(null)).toEqual([])
  })
})

describe('helpers', () => {
  it('normaliza con case-insensitive', () => {
    expect(normalize('C:\\Proj\\X\\')).toBe('c:\\proj\\x')
  })

  it('label usa el nombre o la última carpeta', () => {
    expect(workspaceLabel({ name: 'Mi Proyecto' })).toBe('Mi Proyecto')
    expect(workspaceLabel({ root: 'C:\\proj\\mi-app' })).toBe('mi-app')
  })
})

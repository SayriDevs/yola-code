// ── YOLA Code — Tests del filesApi propio (contrato real del bridge) ──
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildYolaFilesApi } from './api'

afterEach(() => vi.unstubAllGlobals())

function mockFetchRoute(needle, resp) {
  vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
    if (String(url).includes(needle)) return resp
    return { ok: false, status: 404 }
  }))
}

describe('buildYolaFilesApi.list', () => {
  it('parsea el formato REAL del bridge: { entries: [...] }', async () => {
    mockFetchRoute('/files?', { ok: true, json: async () => ({
      entries: [{ name: 'a.rs', type: 'file', absolute: 'D:/a.rs' }],
    }) })
    const api = buildYolaFilesApi('http://localhost:7779')
    const list = await api.list('D:\\ws')
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('a.rs')
  })

  it('también acepta array plano (defensa ante cambios de contrato)', async () => {
    mockFetchRoute('/files?', { ok: true, json: async () => [{ name: 'x', type: 'file' }] })
    const api = buildYolaFilesApi('http://localhost:7779')
    const list = await api.list('D:\\ws')
    expect(list).toHaveLength(1)
  })

  it('lanza con formato inesperado (nunca enmascarar)', async () => {
    mockFetchRoute('/files?', { ok: true, json: async () => ({ rara: true }) })
    const api = buildYolaFilesApi('http://localhost:7779')
    await expect(api.list('D:\\ws')).rejects.toThrow(/inesperado/)
  })

  it('usa la ruta REAL /files (no /files/list)', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ entries: [] }) }))
    vi.stubGlobal('fetch', fetchMock)
    const api = buildYolaFilesApi('http://localhost:7779')
    await api.list('D:\\ws', 'src')
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/files?')
    expect(String(fetchMock.mock.calls[0][0])).not.toContain('/files/list')
  })
})

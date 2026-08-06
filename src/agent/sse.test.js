// ── YOLA Code — Tests del contrato SSE del agente ────────────
import { describe, it, expect } from 'vitest'
import { parseSseLine, extractCodeBlock, accumulateText } from './sse'

describe('parseSseLine', () => {
  it('parsea un evento data: con JSON', () => {
    const r = parseSseLine('data: {"type":"token","text":"hola"}')
    expect(r.event.type).toBe('token')
    expect(r.event.text).toBe('hola')
  })

  it('reconoce [DONE]', () => {
    const r = parseSseLine('data: [DONE]')
    expect(r.done).toBe(true)
  })

  it('ignora líneas que no son data:', () => {
    expect(parseSseLine('')).toBeNull()
    expect(parseSseLine('event: message')).toBeNull()
    expect(parseSseLine(': comentario')).toBeNull()
  })

  it('tolera ruido JSON inválido', () => {
    expect(parseSseLine('data: esto no es json')).toBeNull()
  })
})

describe('extractCodeBlock', () => {
  it('extrae el primer bloque fenced', () => {
    const r = extractCodeBlock('aquí tienes:\n```js\nconst x = 1\n```\nfin')
    expect(r.lang).toBe('js')
    expect(r.code).toBe('const x = 1')
  })

  it('devuelve null sin bloque', () => {
    expect(extractCodeBlock('solo texto')).toBeNull()
  })

  it('quita el salto final del bloque', () => {
    const r = extractCodeBlock('```\na\nb\n```')
    expect(r.code).toBe('a\nb')
  })
})

describe('accumulateText', () => {
  it('acumula tokens y reasoning', () => {
    const text = accumulateText([
      { type: 'token', text: 'hola ' },
      { type: 'reasoning', text: '[pensando] ' },
      { type: 'token', text: 'mundo' },
    ])
    expect(text).toBe('hola [pensando] mundo')
  })
})

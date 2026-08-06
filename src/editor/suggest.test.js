// ── YOLA Code — Tests de utilidades del editor (suggest) ─────
import { describe, it, expect } from 'vitest'
import { buildWordMap, suggest, toggleCommentText, commentMarker, isWordChar } from './suggest'

describe('buildWordMap', () => {
  it('cuenta frecuencias de identificadores (min 3 chars)', () => {
    const map = buildWordMap('const foo = foo + bar\nfoo()')
    expect(map.get('foo')).toBe(3)
    expect(map.get('bar')).toBe(1)
    expect(map.get('const')).toBe(1)
  })

  it('ignora palabras cortas y números', () => {
    const map = buildWordMap('a bc de 123 4567')
    expect(map.has('a')).toBe(false)
    expect(map.has('bc')).toBe(false)
    expect(map.has('de')).toBe(false)
  })
})

describe('suggest', () => {
  it('sugiere keywords del lenguaje por prefijo', () => {
    const items = suggest('con', 'js', buildWordMap(''))
    expect(items).toContain('const')
  })

  it('sugiere palabras del documento por frecuencia', () => {
    const items = suggest('fo', 'js', buildWordMap('foo foo foobar'))
    expect(items[0]).toBe('foo')
    expect(items).toContain('foobar')
  })

  it('devuelve [] sin token o con solo números', () => {
    expect(suggest('', 'js', buildWordMap(''))).toEqual([])
    expect(suggest('123', 'js', buildWordMap(''))).toEqual([])
  })
})

describe('toggleCommentText', () => {
  it('comenta una línea en js', () => {
    const res = toggleCommentText('const x = 1', '//')
    expect(res.text).toBe('// const x = 1')
    expect(res.commented).toBe(true)
  })

  it('descomenta una línea ya comentada', () => {
    const res = toggleCommentText('  // const x = 1', '//')
    expect(res.text).toBe('  const x = 1')
    expect(res.commented).toBe(false)
  })

  it('comenta múltiples líneas', () => {
    const res = toggleCommentText('a\nb', '//')
    expect(res.text).toBe('// a\n// b')
  })

  it('descomenta múltiples líneas ya comentadas', () => {
    const res = toggleCommentText('// a\n// b', '//')
    expect(res.text).toBe('a\nb')
  })

  it('html: usa apertura y cierre', () => {
    const res = toggleCommentText('<div>hola</div>', '<!--')
    expect(res.text).toBe('<!-- <div>hola</div> -->')
    const back = toggleCommentText(res.text, '<!--')
    expect(back.text).toBe('<div>hola</div>')
  })

  it('sin marker (json): no hace nada destructivo', () => {
    const res = toggleCommentText('{"a": 1}', '')
    expect(res.text).toBe('{"a": 1}')
  })
})

describe('commentMarker / isWordChar', () => {
  it('mapea lenguajes a su marcador', () => {
    expect(commentMarker('js')).toBe('//')
    expect(commentMarker('py')).toBe('#')
    expect(commentMarker('html')).toBe('<!--')
    expect(commentMarker('json')).toBe('')
  })

  it('reconoce caracteres de palabra', () => {
    expect(isWordChar('a')).toBe(true)
    expect(isWordChar('_')).toBe(true)
    expect(isWordChar(' ')).toBe(false)
    expect(isWordChar('.')).toBe(false)
  })
})

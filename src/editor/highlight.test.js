// ── YOLA Code — highlight: tests (vitest) ────────────────────
import { describe, expect, test } from 'vitest'
import { highlight, detectLanguage } from './highlight'

describe('highlight', () => {
  test('XSS-safe: HTML embebido se escapa, nunca se ejecuta', () => {
    const html = highlight('<script>alert(1)</script>', 'js')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('js: keywords, strings, numbers y funciones coloreados', () => {
    const html = highlight('const x = "hola";\nfunction foo(n) { return n + 1 }', 'js')
    expect(html).toContain('yk-k">const</span>')
    expect(html).toContain('yk-s">"hola"</span>')
    expect(html).toContain('yk-f">foo</span>')
    expect(html).toContain('yk-n">1</span>')
  })

  test('no anida spans: string con keyword dentro queda como string', () => {
    const html = highlight('const s = "return"', 'js')
    expect(html).toContain('yk-s">"return"</span>')
    // "return" dentro del string NO debe tener span de keyword dentro
    const strSpan = html.match(/yk-s">([^<]*)<\/span>/)[1]
    expect(strSpan).not.toContain('yk-k')
  })

  test('json: strings y números', () => {
    const html = highlight('{"a": 42, "b": true}', 'json')
    expect(html).toContain('yk-n">42</span>')
    expect(html).toContain('yk-k">true</span>')
  })

  test('md: headers, negritas y code inline', () => {
    const html = highlight('# Título\n**negrita**\n`codigo`', 'md')
    expect(html).toContain('yk-k"># Título</span>')
    expect(html).toContain('yk-k">**negrita**</span>')
    expect(html).toContain('yk-s">`codigo`</span>')
  })

  test('detectLanguage por extensión', () => {
    expect(detectLanguage('app.js')).toBe('js')
    expect(detectLanguage('App.jsx')).toBe('js')
    expect(detectLanguage('styles.css')).toBe('css')
    expect(detectLanguage('README.md')).toBe('md')
    expect(detectLanguage('main.py')).toBe('python')
    expect(detectLanguage('build.sh')).toBe('shell')
    expect(detectLanguage('sin-extension')).toBe('txt')
  })

  test('txt: sin color pero escapado', () => {
    const html = highlight('<b>hola</b>', 'txt')
    expect(html).toBe('&lt;b&gt;hola&lt;/b&gt;')
  })
})

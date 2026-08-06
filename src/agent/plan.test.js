// ── YOLA Code — Tests del Agent Mode (plan + diffs) ───────────
import { describe, it, expect } from 'vitest'
import { parseChecklist, diffLines, isFileWritingTool, toolPath } from './plan'

describe('parseChecklist', () => {
  it('parsea checkboxes markdown', () => {
    const items = parseChecklist('- [ ] tarea uno\n- [x] tarea dos')
    expect(items).toEqual([
      { title: 'tarea uno', done: false },
      { title: 'tarea dos', done: true },
    ])
  })

  it('acepta símbolos ☐ ☑ ✓', () => {
    const items = parseChecklist('☐ pendiente\n☑ hecha\n✓ hecha2')
    expect(items[0]).toEqual({ title: 'pendiente', done: false })
    expect(items[1].done).toBe(true)
    expect(items[2].done).toBe(true)
  })

  it('devuelve [] sin checklist', () => {
    expect(parseChecklist('solo texto sin lista')).toEqual([])
    expect(parseChecklist('')).toEqual([])
  })

  it('tolera indentación', () => {
    const items = parseChecklist('   - [ ]  con indent')
    expect(items[0].title).toBe('con indent')
  })
})

describe('diffLines', () => {
  it('detecta líneas agregadas, eliminadas e iguales', () => {
    const d = diffLines('a\nb\nc', 'a\nB\nc\nd')
    const types = d.map(x => x.type)
    expect(types).toContain(' ')
    expect(types).toContain('-')
    expect(types).toContain('+')
    expect(d.find(x => x.text === 'B').type).toBe('+')
  })

  it('colapsa diffs gigantes con límite', () => {
    const bigA = Array.from({ length: 100 }, (_, i) => `l${i}`).join('\n')
    const bigB = bigA + '\nextra'
    const d = diffLines(bigA, bigB)
    expect(d.length).toBeLessThanOrEqual(40)
    expect(d.some(x => x.type === '…')).toBe(true)
  })

  it('archivo vacío → todo agregado', () => {
    const d = diffLines('', 'hola\nmundo')
    expect(d.every(x => x.type === '+')).toBe(true)
  })
})

describe('helpers', () => {
  it('reconoce tools que escriben archivos', () => {
    expect(isFileWritingTool('write')).toBe(true)
    expect(isFileWritingTool('edit')).toBe(true)
    expect(isFileWritingTool('apply_patch')).toBe(true)
    expect(isFileWritingTool('bash')).toBe(false)
    expect(isFileWritingTool('read')).toBe(false)
  })

  it('extrae el path de los argumentos', () => {
    expect(toolPath({ path: 'a.ts' })).toBe('a.ts')
    expect(toolPath({ file: 'b.rs' })).toBe('b.rs')
    expect(toolPath({ command: 'ls' })).toBeNull()
    expect(toolPath(null)).toBeNull()
  })
})

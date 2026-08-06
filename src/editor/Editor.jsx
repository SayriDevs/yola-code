// ── YOLA Code — Editor con syntax highlighting (overlay) ─────
// Técnica estándar de editores ligeros: textarea transparente
// (caret visible) sobre un <pre> coloreado. Scroll sincronizado.
//
// v0.6: UNDO/REDO REAL — textarea NO controlado (el binding reactivo
// re-asignaba .value en cada tecla y destruía la pila del browser) +
// pila propia de snapshots (beforeinput + commits programáticos).
// v0.4.1: gutter con números de línea, línea activa, atajos de
// edición y autocompletado ligero.
// ──────────────────────────────────────────────────────────────
import { createMemo, createSignal, For, Show, onMount } from 'solid-js'
import { highlight } from './highlight'
import { isWordChar, suggest, buildWordMap, commentMarker, toggleCommentText } from './suggest'

const EDITOR_FONT = {
  'font-family': 'ui-monospace, Consolas, monospace',
  'font-size': '12.5px',
  'line-height': '1.6',
  'white-space': 'pre-wrap',
  'word-break': 'break-all',
}
const LINE_H = 20 // 12.5px * 1.6
const PAD_T = 10
const PAD_L = 12
const GUTTER_W = 44
const UNDO_LIMIT = 200

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function Editor(props) {
  // props: { content, lang, onChange, onSave, dirty, onCursor, onTa }
  // Archivos > ~100 KB: highlight desactivado (el innerHTML completo por
  // tecla bloquea el hilo). Texto plano con escape, números de línea vivos.
  const LARGE = props.content.length > 100_000
  const html = createMemo(() => {
    if (LARGE) return escapeHtml(props.content)
    return highlight(props.content, props.lang)
  })
  const lineCount = createMemo(() => props.content.split('\n').length)
  const wordMap = createMemo(() => {
    // cap de tamaño: no indexar documentos gigantes en cada tecla
    return buildWordMap(props.content.length > 120_000 ? props.content.slice(0, 120_000) : props.content)
  })

  let preRef
  let taRef
  const [scrollY, setScrollY] = createSignal(0)
  const [cursor, setCursor] = createSignal({ line: 1, col: 1 })
  const [sugg, setSugg] = createSignal(null) // {start, items, idx}

  // ── Undo/redo: pila propia (el textarea es NO controlado) ──
  let undoStack = []
  let redoStack = []

  function pushUndo() {
    const t = taRef
    if (!t) return
    undoStack.push({ v: t.value, s: t.selectionStart, e: t.selectionEnd })
    if (undoStack.length > UNDO_LIMIT) undoStack.shift()
    redoStack = []
  }

  function restoreEntry(entry) {
    const t = taRef
    if (!t) return
    t.value = entry.v
    t.setSelectionRange(entry.s, entry.e)
    props.onChange(entry.v)
    reportCursor(t)
    setSugg(null)
  }

  function undo() {
    const t = taRef
    if (!t) return
    if (!undoStack.length) return
    redoStack.push({ v: t.value, s: t.selectionStart, e: t.selectionEnd })
    restoreEntry(undoStack.pop())
  }

  function redo() {
    const t = taRef
    if (!t) return
    if (!redoStack.length) return
    undoStack.push({ v: t.value, s: t.selectionStart, e: t.selectionEnd })
    restoreEntry(redoStack.pop())
  }

  function reportCursor(el) {
    const pos = el.selectionStart
    const before = props.content.slice(0, pos)
    const lns = before.split('\n')
    const posObj = { line: lns.length, col: lns[lns.length - 1].length + 1 }
    setCursor(posObj)
    props.onCursor?.(posObj.line, posObj.col)
    props.onSelection?.(el.selectionStart !== el.selectionEnd)
  }

  function syncScroll(e) {
    if (preRef) {
      preRef.scrollTop = e.target.scrollTop
      preRef.scrollLeft = e.target.scrollLeft
    }
    setScrollY(e.target.scrollTop)
  }

  // ── Edición programática (snapshot + mutar + caret + onChange) ──
  function commit(el, value, selStart, selEnd) {
    pushUndo() // snapshot ANTES de mutar (la pila del browser no existe aquí)
    el.value = value
    el.setSelectionRange(selStart, selEnd)
    props.onChange(value)
    reportCursor(el)
  }

  function duplicateLine(e) {
    const t = e.target
    const s = t.selectionStart
    const en = t.selectionEnd
    const v = t.value
    if (s === en) {
      if (!v.length) return
      const ls = v.lastIndexOf('\n', s - 1) + 1
      let le = v.indexOf('\n', s)
      if (le === -1) le = v.length
      const line = v.slice(ls, le)
      const sep = le < v.length || !v.endsWith('\n') ? '\n' : ''
      const newV = v.slice(0, le) + sep + line + v.slice(le)
      const caret = le + sep.length + line.length
      commit(t, newV, caret, caret)
    } else {
      const sel = v.slice(s, en)
      commit(t, v.slice(0, en) + sel + v.slice(en), en, en + sel.length)
    }
  }

  function toggleComment(e) {
    const t = e.target
    const s = t.selectionStart
    const en = t.selectionEnd
    const v = t.value
    const marker = commentMarker(props.lang)
    const ls = v.lastIndexOf('\n', s - 1) + 1
    let le = v.indexOf('\n', en)
    if (le === -1) le = v.length
    const block = v.slice(ls, le)
    const res = toggleCommentText(block, marker)
    commit(t, v.slice(0, ls) + res.text + v.slice(le), ls, ls + res.text.length)
  }

  function moveLine(e, dir) {
    const t = e.target
    const s = t.selectionStart
    const v = t.value
    if (!v.length) return
    const ls = v.lastIndexOf('\n', s - 1) + 1
    let le = v.indexOf('\n', s)
    if (le === -1) le = v.length
    const lineEnd = le < v.length ? le + 1 : le // incluye el \n si existe
    if (dir < 0) {
      if (ls === 0) return
      const prevStart = v.lastIndexOf('\n', ls - 2) + 1
      const newV = v.slice(0, prevStart) + v.slice(ls, lineEnd) + v.slice(prevStart, ls) + v.slice(lineEnd)
      const caret = prevStart + (lineEnd - ls) + (s - ls)
      commit(t, newV, caret, caret)
    } else {
      if (lineEnd >= v.length) return
      const nextStart = lineEnd
      let nextEnd = v.indexOf('\n', nextStart + 1)
      if (nextEnd === -1) nextEnd = v.length
      else nextEnd += 1
      const newV = v.slice(0, ls) + v.slice(nextStart, nextEnd) + v.slice(ls, lineEnd) + v.slice(nextEnd)
      const caret = ls + (nextEnd - nextStart) + (s - ls)
      commit(t, newV, caret, caret)
    }
  }

  // ── Autocompletado ligero ──
  function maybeSuggest(el) {
    const pos = el.selectionStart
    const v = el.value
    let i = pos - 1
    while (i >= 0 && isWordChar(v[i])) i--
    const token = v.slice(i + 1, pos)
    if (token.length < 1) { setSugg(null); return }
    const items = suggest(token, props.lang, wordMap())
    if (!items.length) { setSugg(null); return }
    setSugg({ start: i + 1, items, idx: 0 })
  }

  function acceptSuggestion() {
    const g = sugg()
    if (!g) return
    const t = taRef
    const v = t.value
    const item = g.items[g.idx]
    const caret = g.start + item.length
    commit(t, v.slice(0, g.start) + item + v.slice(t.selectionStart), caret, caret)
    setSugg(null)
  }

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 's') {
      e.preventDefault()
      props.onSave?.()
      return
    }
    // Undo/redo propios (el textarea no controlado NO tiene pila del browser)
    if (mod && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return }
    if (mod && e.shiftKey && e.key === 'Z') { e.preventDefault(); redo(); return }
    if (mod && !e.shiftKey && e.key === 'y') { e.preventDefault(); redo(); return }
    // Autocompletado abierto: Enter/Tab aceptan, flechas navegan, Esc cierra
    if (sugg()) {
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); acceptSuggestion(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSugg(g => g ? { ...g, idx: (g.idx + 1) % g.items.length } : g); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSugg(g => g ? { ...g, idx: (g.idx - 1 + g.items.length) % g.items.length } : g); return }
      if (e.key === 'Escape') { e.preventDefault(); setSugg(null); return }
    }
    if (mod && e.key === 'd') { e.preventDefault(); duplicateLine(e); return }
    if (mod && e.key === '/') { e.preventDefault(); toggleComment(e); return }
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); moveLine(e, -1); return }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveLine(e, 1); return }
    if (e.key === 'Tab' && !mod) {
      // Tab con ctrl/meta NO indentar (Ctrl+Tab cicla pestañas en el root)
      e.preventDefault()
      const t = e.target
      const s = t.selectionStart
      const v = t.value
      commit(t, v.slice(0, s) + '  ' + v.slice(t.selectionEnd), s + 2, s + 2)
    }
  }

  // Sincronización del textarea NO controlado: solo cuando el contenido
  // externo difiere (cambio de tab/archivo). Nunca durante la escritura.
  onMount(() => {
    if (taRef && taRef.value !== props.content) {
      taRef.value = props.content
      props.onTa?.(taRef)
      reportCursor(taRef)
    }
  })

  // visible lines (gutter virtualizado — ventana ~40 líneas)
  const viewStart = () => Math.max(0, Math.floor(scrollY() / LINE_H) - 8)
  const viewCount = () => 48
  const visibleLines = createMemo(() => {
    const n = lineCount()
    const start = Math.min(viewStart(), n)
    const end = Math.min(start + viewCount(), n)
    return { start, end, n }
  })

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden', background: 'var(--bg-desktop)', display: 'flex' }}>
      <style>{`
        .yk-k { color: var(--syntax-keyword); } .yk-s { color: var(--syntax-string); }
        .yk-c { color: var(--syntax-comment); font-style: italic; }
        .yk-n { color: var(--syntax-number); } .yk-f { color: var(--syntax-function); }
        .yk-p { color: var(--syntax-punct); }
      `}</style>

      {/* Gutter con números de línea (virtualizado) */}
      <div style={{
        width: `${GUTTER_W}px`, 'flex-shrink': 0, overflow: 'hidden', position: 'relative',
        background: 'var(--bg-window-header)', 'border-right': '1px solid var(--border-window)',
        'user-select': 'none',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          {/* spacer superior (líneas antes de la ventana) */}
          <div style={{ height: `${visibleLines().start * LINE_H}px` }} />
          <For each={Array.from({ length: visibleLines().end - visibleLines().start }, (_, i) => visibleLines().start + i + 1)}>
            {(n) => (
              <div style={{
                height: `${LINE_H}px`, 'line-height': `${LINE_H}px`, 'font-size': '11px',
                paddingRight: '7px', 'text-align': 'right', 'font-family': 'ui-monospace, Consolas, monospace',
                color: n === cursor().line ? 'var(--accent)' : 'var(--text-secondary)',
                'font-weight': n === cursor().line ? 700 : 400,
                background: n === cursor().line ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
              }}>{n}</div>
            )}
          </For>
          <div style={{ height: `${(visibleLines().n - visibleLines().end) * LINE_H}px` }} />
        </div>
      </div>

      {/* Área de edición */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      {/* Línea activa */}
      <Show when={LARGE}>
        <div style={{
          position: 'absolute', top: '4px', right: '8px', zIndex: '5', 'pointer-events': 'none',
          'font-size': '9.5px', color: 'var(--warning)',
          background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
          padding: '1px 7px', 'border-radius': '8px', 'font-family': 'var(--font)',
        }}>archivo grande — resaltado desactivado</div>
      </Show>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: `${LINE_H}px`, 'pointer-events': 'none',
          top: `${(cursor().line - 1) * LINE_H + PAD_T - scrollY()}px`,
          background: 'color-mix(in srgb, var(--accent) 7%, transparent)',
          zIndex: '0',
        }} />
        <pre
          ref={preRef}
          aria-hidden="true"
          style={{
            position: 'absolute', inset: '0', margin: '0', overflow: 'hidden',
            color: 'var(--text-primary)', 'pointer-events': 'none', zIndex: '1',
            padding: `${PAD_T}px ${PAD_L}px`,
            ...EDITOR_FONT,
          }}
          innerHTML={html()}
        />
        <textarea
          ref={(el) => {
            taRef = el
            if (el && !el.dataset.initialized) {
              el.value = props.content
              el.dataset.initialized = '1'
              props.onTa?.(el)
            }
          }}
          onInput={(e) => {
            // el browser YA mutó el value — solo notificar (sin re-asignar)
            props.onChange(e.target.value)
            reportCursor(e.target)
            maybeSuggest(e.target)
          }}
          onBeforeInput={() => pushUndo()}
          onScroll={syncScroll}
          onKeyDown={onKeyDown}
          onKeyUp={(e) => reportCursor(e.target)}
          onSelect={(e) => { reportCursor(e.target); maybeSuggest(e.target) }}
          onBlur={() => setTimeout(() => setSugg(null), 150)}
          spellcheck={false}
          style={{
            position: 'absolute', inset: '0', border: 'none', outline: 'none', resize: 'none',
            background: 'transparent', color: 'transparent', 'caret-color': 'var(--text-primary)',
            zIndex: '2', padding: `${PAD_T}px ${PAD_L}px`,
            ...EDITOR_FONT,
          }}
        />

        {/* Popup de autocompletado */}
        <Show when={sugg()}>
          <div
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: 'absolute', zIndex: '10', 'min-width': '180px', 'max-width': '280px',
              left: `${PAD_L}px`,
              top: `${Math.min((cursor().line) * LINE_H + PAD_T - scrollY(), 120)}px`,
              background: 'var(--bg-window)', border: '1px solid var(--border-window)',
              'border-radius': '8px', 'box-shadow': 'var(--shadow)', padding: '4px',
              'font-family': 'ui-monospace, Consolas, monospace', 'font-size': '11.5px',
              'max-height': '220px', overflow: 'auto',
            }}
          >
            <For each={sugg().items}>
              {(item, i) => (
                <div
                  onClick={() => { const g = sugg(); if (g) { setSugg({ ...g, idx: i() }); acceptSuggestion() } }}
                  style={{
                    padding: '3px 8px', 'border-radius': '4px', cursor: 'pointer',
                    color: i() === sugg().idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: i() === sugg().idx ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'transparent',
                    'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis',
                  }}
                >{item}</div>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  )
}

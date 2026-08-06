// ── YOLA Code — Utilidades del editor (autocompletado, comentarios) ──
// Funciones PURAS — sin DOM, testables con vitest.
// ──────────────────────────────────────────────────────────────

export const isWordChar = (c) => /[a-zA-Z0-9_$]/.test(c)

// Palabras clave por lenguaje (autocompletado cuando no hay LSP)
export const KEYWORDS = {
  js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'default', 'class', 'new', 'this', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'switch', 'case', 'break', 'continue', 'delete', 'in', 'of', 'yield', 'static', 'extends', 'super', 'require', 'module'],
  jsx: ['const', 'let', 'function', 'return', 'import', 'export', 'default', 'class', 'new', 'this', 'async', 'await', 'null', 'undefined', 'true', 'false', 'style', 'className', 'onClick', 'children', 'props', 'state', 'useState', 'useEffect'],
  ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'default', 'interface', 'type', 'class', 'new', 'this', 'async', 'await', 'null', 'undefined', 'true', 'false', 'switch', 'case', 'break', 'continue', 'enum', 'implements', 'extends', 'readonly', 'private', 'public', 'protected', 'static', 'unknown', 'never', 'any', 'string', 'number', 'boolean'],
  tsx: ['const', 'let', 'function', 'return', 'import', 'export', 'default', 'interface', 'type', 'class', 'new', 'this', 'async', 'await', 'null', 'undefined', 'true', 'false', 'style', 'className', 'onClick', 'children', 'props', 'useState', 'useEffect'],
  rs: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'pub', 'crate', 'self', 'match', 'if', 'else', 'loop', 'while', 'for', 'return', 'async', 'await', 'move', 'ref', 'type', 'dyn', 'where', 'unsafe', 'true', 'false', 'None', 'Some', 'Ok', 'Err', 'String', 'Vec', 'Result', 'Option'],
  py: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise', 'lambda', 'None', 'True', 'False', 'and', 'or', 'not', 'is', 'in', 'pass', 'break', 'continue', 'global', 'self', 'yield', 'async', 'await', 'print', 'len', 'range', 'list', 'dict', 'set'],
  sh: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'exit', 'echo', 'export', 'local', 'read', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'sed', 'awk', 'sudo', 'source', 'true', 'false'],
  css: ['color', 'background', 'display', 'flex', 'margin', 'padding', 'width', 'height', 'font', 'font-size', 'font-family', 'font-weight', 'border', 'border-radius', 'position', 'absolute', 'relative', 'fixed', 'top', 'right', 'bottom', 'left', 'overflow', 'z-index', 'opacity', 'cursor', 'gap', 'align-items', 'justify-content', 'flex-direction', 'transition', 'transform', 'box-shadow', 'text-align', 'text-decoration', 'line-height', 'white-space'],
  html: ['div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'textarea', 'select', 'option', 'header', 'footer', 'nav', 'section', 'article', 'main', 'aside', 'class', 'id', 'style', 'href', 'src', 'alt', 'type', 'name', 'value', 'placeholder', 'disabled', 'lang'],
  yml: ['name', 'version', 'description', 'author', 'icon', 'category', 'entry', 'checksum', 'permissions', 'repo', 'singleton', 'true', 'false', 'null', 'on', 'off'],
  yaml: ['name', 'version', 'description', 'author', 'icon', 'category', 'entry', 'checksum', 'permissions', 'repo', 'singleton', 'true', 'false', 'null', 'on', 'off'],
  toml: ['name', 'version', 'edition', 'description', 'features', 'default', 'dependencies', 'path', 'optional', 'true', 'false', 'package', 'bin', 'lib'],
  json: ['"id"', '"name"', '"version"', '"author"', '"entry"', '"checksum"', '"permissions"', '"repo"', '"description"', '"true"', '"false"', '"null"'],
}

// Marcadores de comentario por lenguaje ('' = sin soporte)
export const COMMENT = {
  js: '//', jsx: '//', ts: '//', tsx: '//', rs: '//', css: '//',
  py: '#', sh: '#', yml: '#', yaml: '#', toml: '#',
  html: '<!--', md: '<!--',
}

export function commentMarker(lang) {
  return COMMENT[lang] || ''
}

/// Mapa de frecuencia de palabras del documento (para completar).
/// Solo identificadores >= 3 chars, normalizados a minúsculas.
export function buildWordMap(content) {
  const map = new Map()
  const re = /[a-zA-Z_$][a-zA-Z0-9_$]{2,}/g
  let m
  while ((m = re.exec(content))) {
    const w = m[0].toLowerCase()
    map.set(w, (map.get(w) || 0) + 1)
  }
  return map
}

/// Sugerencias para un token: palabras del documento (por frecuencia,
/// contexto local manda) + keywords del lenguaje. Devuelve [] si no hay.
export function suggest(token, lang, wordMap) {
  if (!token || /^\d+$/.test(token)) return []
  const t = token.toLowerCase()
  const out = []
  const seen = new Set()
  const docWords = [...wordMap.entries()]
    .filter(([w]) => w.startsWith(t) && w !== t)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  for (const [w] of docWords) { out.push(w); seen.add(w) }
  for (const k of (KEYWORDS[lang] || [])) {
    if (k.toLowerCase().startsWith(t) && !seen.has(k)) { out.push(k); seen.add(k) }
  }
  return out.slice(0, 12)
}

/// Comenta/descomenta un bloque (posiblemente multilínea).
/// Devuelve { text, commented } — commented indica si quedó comentado.
export function toggleCommentText(block, marker) {
  if (!marker) return { text: block, commented: block.trim().startsWith('//') }
  const close = marker === '<!--' ? '-->' : ''
  const lines = block.split('\n')

  const isCommented = (l) => {
    const t = l.trim()
    if (marker === '<!--') return t.startsWith('<!--') && t.endsWith('-->')
    return t.startsWith(marker)
  }

  if (lines.every(isCommented)) {
    // descomentar — preserva la indentación original
    const out = lines.map(l => {
      if (marker === '<!--') {
        return l.replace(/^\s*<!--\s?/, '').replace(/\s?-->$/, '')
      }
      return l.replace(new RegExp(`^(\\s*)${escapeRe(marker)}\\s?`), (_, sp) => sp)
    })
    return { text: out.join('\n'), commented: false }
  }

  const out = lines.map(l => {
    if (marker === '<!--') {
      const ind = l.match(/^\s*/)[0]
      return `${ind}<!-- ${l.trim()} -->`
    }
    return l.replace(/^(\s*)/, (_, sp) => `${sp}${marker} `)
  })
  return { text: out.join('\n'), commented: true }
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

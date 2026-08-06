// ── YOLA Code — Syntax highlighting (puro, XSS-safe) ─────────
// Escapa el HTML PRIMERO y luego colorea con placeholders: cada
// regla reemplaza sus matches por \x00N\x00 (que ninguna regla
// posterior matchea) → cero spans anidados, cero inyección.
// ──────────────────────────────────────────────────────────────

// Las comillas NO se escapan: el regex de strings las necesita literales,
// y dentro de texto de <span> solo son peligrosas & < > (las comillas solo
// romperían HTML dentro de atributos, que aquí no existen).
function escapeHtml(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Índice en base 26 (solo letras a-z): los placeholders no pueden
// contener dígitos porque la regla de números (\b\d+\b) los matchearía
// y corrompería el marcador antes de restaurarlo.
function alphaIdx(n) {
  let s = ''
  n++
  while (n > 0) {
    n--
    s = String.fromCharCode(97 + (n % 26)) + s
    n = Math.floor(n / 26)
  }
  return s
}

const RULES = {
  js: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, 'c'],
    [/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, 's'],
    [/\b(const|let|var|function|return|if|else|for|while|import|export|from|new|class|extends|async|await|try|catch|throw|switch|case|break|default|typeof|instanceof)\b/g, 'k'],
    [/\b(?:true|false|null|undefined|NaN)\b/g, 'k'],
    [/\b\d+(?:\.\d+)?\b/g, 'n'],
    [/[A-Za-z_$][\w$]*(?=\s*\()/g, 'f'],
  ],
  json: [
    [/"(?:[^"\\\n]|\\.)*"/g, 's'],
    [/\b(?:true|false|null)\b/g, 'k'],
    [/-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g, 'n'],
  ],
  md: [
    [/^#{1,6} .*$/gm, 'k'],
    [/^>.*$/gm, 'c'],
    [/\*\*[^*]+\*\*|__[^_]+__/g, 'k'],
    [/`[^`]+`/g, 's'],
    [/\[[^\]]+\]\([^)]+\)/g, 'f'],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//g, 'c'],
    [/#[0-9a-fA-F]{3,8}\b/g, 'n'],
    [/[a-z-]+(?=\s*:)/g, 'f'],
    [/(?:--)?[a-zA-Z-]+(?=\s*:)/g, 'p'],
    [/\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|fr|deg)\b/g, 'n'],
  ],
  html: [
    [/&lt;!--[\s\S]*?--&gt;/g, 'c'],
    [/&lt;\/?[a-zA-Z][\w-]*/g, 'k'],
    [/[a-zA-Z-]+(?==\"|=')/g, 'p'],
    [/"[^"]*"/g, 's'],
  ],
  python: [
    [/#[^\n]*/g, 'c'],
    [/'''[\s\S]*?'''|"""(?:[^"\\]|\\.)*?"""|'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, 's'],
    [/\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|None|True|False|and|or|not|in|is)\b/g, 'k'],
    [/\b\d+(?:\.\d+)?\b/g, 'n'],
    [/[A-Za-z_]\w*(?=\s*\()/g, 'f'],
  ],
  shell: [
    [/#[^\n]*/g, 'c'],
    [/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`/g, 's'],
    [/\b(cd|ls|cat|grep|npm|bun|git|echo|export|mkdir|rm|cp|mv|node|sudo|curl|wget|pnpm|yarn)\b/g, 'k'],
    [/\b\d+(?:\.\d+)?\b/g, 'n'],
  ],
  txt: [],
}

const LANG_BY_EXT = {
  js: 'js', jsx: 'js', mjs: 'js', cjs: 'js', ts: 'js', tsx: 'js',
  json: 'json', md: 'md', markdown: 'md', css: 'css', scss: 'css',
  html: 'html', htm: 'html', py: 'python', sh: 'shell', bash: 'shell', zsh: 'shell', ps1: 'shell',
}

export function detectLanguage(name) {
  const ext = String(name || '').split('.').pop().toLowerCase()
  return LANG_BY_EXT[ext] || 'txt'
}

export function highlight(code, lang) {
  const rules = RULES[lang] || RULES.txt
  let src = escapeHtml(code)
  if (!rules.length) return src
  const tokens = []
  for (const [re, cls] of rules) {
    src = src.replace(re, (m) => {
      tokens.push(`<span class="yk-${cls}">${m}</span>`)
      return `\u0000${alphaIdx(tokens.length - 1)}\u0000`
    })
  }
  return src.replace(/\u0000([a-z]+)\u0000/g, (_, key) => {
    let n = 0
    for (const ch of key) n = n * 26 + (ch.charCodeAt(0) - 96)
    return tokens[n - 1]
  })
}

// fix de los backticks dobles rotos por el replace de shell (solo patrones exactos)
import { readFileSync, writeFileSync } from 'node:fs'
let c = readFileSync('src/App.jsx', 'utf8')
const before = c
c = c.replaceAll('notifyError(``', 'notifyError(`')
c = c.replaceAll('``)', '`)')
if (c !== before) {
  writeFileSync('src/App.jsx', c, 'utf8')
  console.log('fix aplicado')
} else {
  console.log('sin cambios')
}
// re-verificación: backticks impares
const lines = c.split('\n')
let issues = 0
lines.forEach((l, i) => {
  const count = (l.match(/`/g) || []).length
  if (count % 2 === 1) { issues++; console.log(`IMPAR ${i + 1}: ${l.trim().slice(0, 100)}`) }
})
console.log(issues === 0 ? 'OK: templates balanceados' : `ROTAS: ${issues}`)

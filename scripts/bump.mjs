// bump v0.6.6 → v0.7.0 (Agent Mode: plan visible + aprobar + diffs con revert)
import { readFileSync, writeFileSync } from 'node:fs'

const NEW_VERSION = '0.7.0'
const NEW_CHECKSUM = '1b993637e82244fcb860d566297ab372d5cc593cad79bc400119731fb8ceb9c6'
const FOOTER = 'Solid + Vite · v0.7.0'

{
  const p = 'package.json'
  let c = readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
  c = c.replace('"0.6.6"', `"${NEW_VERSION}"`)
  writeFileSync(p, c, 'utf8')
  console.log('package.json →', JSON.parse(c).version)
}

{
  const m = JSON.parse(readFileSync('manifest.json', 'utf8'))
  m.version = NEW_VERSION
  m.checksum = NEW_CHECKSUM
  m.description = 'El editor nativo de YOLA. v0.7.0: AGENT MODE — el agente propone un plan como checklist (📋), tú lo apruebas (✅) y ejecuta con tool-calls visibles; cada archivo tocado genera una tarjeta de diff con REVERTIR individual (calculado sobre disco, sin depender del motor).'
  writeFileSync('manifest.json', JSON.stringify(m, null, 2) + '\n', 'utf8')
  console.log('manifest →', m.version)
}

{
  const p = 'src/App.jsx'
  let c = readFileSync(p, 'utf8').replace(/^\uFEFF/, '')
  c = c.replace(/Solid \+ Vite · v0\.6\.\d/, FOOTER)
  writeFileSync(p, c, 'utf8')
  console.log('footer →', FOOTER)
}

// ── YOLA Code — Templates ────────────────────────────────────
// Genera proyectos desde plantillas: "Nueva app", "Nuevo agente".
// Cada template es un conjunto de archivos virtuales que se crean
// en el workspace activo (o en uno nuevo).
// ──────────────────────────────────────────────────────────────

/**
 * @typedef {Object} TemplateFile
 * @property {string} path - ruta relativa al workspace
 * @property {string} content - contenido del archivo
 */

/**
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon
 * @property {string} category - 'app' | 'agent' | 'pipeline'
 * @property {function(name: string): TemplateFile[]} generate
 */

// ── Template: Nueva App ──
const appTemplate = {
  id: 'new-app',
  name: 'Nueva App',
  description: 'App de YOLA OS con SolidJS. Incluye ventana, manifest y entry point.',
  icon: '📱',
  category: 'app',
  generate(name) {
    const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'mi-app'
    const componentName = name.replace(/[^a-zA-Z0-9]/g, '') || 'MiApp'

    return [
      {
        path: 'manifest.json',
        content: JSON.stringify({
          id,
          name,
          author: 'YOLA',
          repo: `github.com/usuario/${id}`,
          icon: '📱',
          category: 'Tools',
          description: `${name} — app para YOLA OS.`,
          version: '0.1.0',
          entry: 'dist/app.js',
          permissions: ['notify'],
        }, null, 2) + '\n',
      },
      {
        path: 'package.json',
        content: JSON.stringify({
          name: id,
          private: true,
          version: '0.1.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            test: 'vitest run',
          },
          dependencies: {
            'solid-js': '^1.9.14',
          },
          devDependencies: {
            vite: '^6.0.0',
            'vite-plugin-solid': '^2.11.13',
            vitest: '^3.0.0',
          },
        }, null, 2) + '\n',
      },
      {
        path: 'vite.config.js',
        content: `import { defineConfig } from 'vite'\nimport solidPlugin from 'vite-plugin-solid'\n\nexport default defineConfig({\n  plugins: [solidPlugin()],\n  build: {\n    lib: {\n      entry: 'src/index.jsx',\n      formats: ['es'],\n      fileName: () => 'app.js',\n    },\n    outDir: 'dist',\n    target: 'es2020',\n    cssCodeSplit: false,\n    rollupOptions: { external: [] },\n  },\n  server: { port: 5200 },\n})\n`,
      },
      {
        path: 'index.html',
        content: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>' + name + ' — dev</title>\n  <style>html,body{height:100%;margin:0}#app{height:100vh}</style>\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module">\n    import { createApp } from \'./src/index.js\'\n    import { render } from \'solid-js/web\'\n    const mockApi = {\n      window: { setTitle: (t) => { document.title = t || \'' + name + '\' } },\n      os: { notify: (msg, type) => console.log(msg) },\n      params: {},\n    }\n    const Comp = createApp(mockApi)\n    render(() => <Comp />, document.getElementById(\'app\'))\n  </script>\n</body>\n</html>\n',
      },
      {
        path: 'src/index.jsx',
        content: `// ── ${name} — entry point ────────────────────────────\nimport { render } from 'solid-js/web'\nimport { createApp } from './App.jsx'\n\nexport { createApp }\n\nexport function mount(api, el) {\n  const Comp = createApp(api)\n  render(() => <Comp />, el)\n}\n`,
      },
      {
        path: 'src/App.jsx',
        content: `// ── ${name} ──────────────────────────────────────────\nimport { createSignal, Show } from 'solid-js'\n\nexport function createApp(api) {\n  return function ${componentName}Window() {\n    const [count, setCount] = createSignal(0)\n\n    return (\n      <div style={{\n        display: 'flex', 'flex-direction': 'column', height: '100%',\n        background: 'var(--bg-window, #1e1e1e)', color: 'var(--text-primary, #d4d4d4)',\n        'font-family': 'system-ui, sans-serif', padding: '2rem',\n        'align-items': 'center', 'justify-content': 'center', gap: '1rem',\n      }}>\n        <div style={{ 'font-size': '32px' }}>📱</div>\n        <h1 style={{ margin: 0, 'font-size': '24px' }}>{api.window?.title || '${name}'}</h1>\n        <p style={{ color: 'var(--text-muted, #888)', 'font-size': '14px' }}>\n          App creada con YOLA Code\n        </p>\n        <button\n          onClick={() => setCount(c => c + 1)}\n          style={{\n            padding: '8px 20px', 'border-radius': '6px', border: '1px solid var(--border-window, #444)',\n            background: 'var(--accent, #0078d4)', color: '#fff', cursor: 'pointer', 'font-size': '14px',\n          }}\n        >\n          Clicks: {count()}\n        </button>\n      </div>\n    )\n  }\n}\n`,
      },
      {
        path: 'README.md',
        content: `# ${name}\n\nApp para YOLA OS creada con YOLA Code.\n\n## Desarrollo\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Build\n\n\`\`\`bash\nnpm run build\n\`\`\`\n\nEl bundle se genera en \`dist/app.js\`.\n`,
      },
    ]
  },
}

// ── Template: Nuevo Agente ──
const agentTemplate = {
  id: 'new-agent',
  name: 'Nuevo Agente',
  description: 'Agente YOLA con prompt system, tools y contrato. Compatible con YOLA OS y OpenCode.',
  icon: '🤖',
  category: 'agent',
  generate(name) {
    const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'mi-agente'

    return [
      {
        path: 'manifest.json',
        content: JSON.stringify({
          id,
          name,
          author: 'YOLA',
          repo: `github.com/usuario/${id}`,
          icon: '🤖',
          category: 'Agents',
          description: `${name} — agente YOLA.`,
          version: '0.1.0',
          type: 'agent',
          entry: 'agent.js',
          tools: ['files', 'bash', 'task'],
          permissions: ['files', 'exec'],
        }, null, 2) + '\n',
      },
      {
        path: 'agent.js',
        content: `// ── ${name} — Agente YOLA ────────────────────────────\n// Contrato: recibe { prompt, files, tools } → ejecuta → devuelve { result, files }\n\n/**\n * @param {Object} ctx\n * @param {string} ctx.prompt - instrucción del usuario\n * @param {Object<string,string>} ctx.files - archivos del workspace { path: content }\n * @param {Object} ctx.tools - herramientas disponibles (files.read, files.write, bash.exec, etc.)\n * @returns {Promise<{ result: string, files?: Object<string,string> }>}\n */\nexport async function run(ctx) {\n  const { prompt, files, tools } = ctx\n\n  // ── System prompt ──\n  const system = \`Eres \${ctx.manifest?.name || '${name}'}, un agente YOLA.\nTrabajas con archivos y herramientas del sistema.\nResponde en español, directo y conciso.\`\n\n  // ── Lógica del agente ──\n  // Aquí implementas la lógica específica de tu agente.\n  // Puedes usar ctx.tools para leer/escribir archivos, ejecutar comandos, etc.\n\n  const fileList = Object.keys(files).join(', ') || '(ninguno)'\n\n  return {\n    result: \`Hola, soy \${ctx.manifest?.name || '${name}'}.\\n\\nArchivos en workspace: \${fileList}\\n\\nPrompt recibido: "\${prompt}"\\n\\n⚠️  Implementa tu lógica en agent.js\`,\n    files: undefined, // { 'ruta/archivo': 'contenido' } si modificas archivos\n  }\n}\n`,
      },
      {
        path: 'agent.test.js',
        content: `// ── ${name} — Tests ──────────────────────────────────\nimport { describe, it, expect } from 'vitest'\nimport { run } from './agent.js'\n\ndescribe('${name}', () => {\n  it('responde con el nombre del agente', async () => {\n    const ctx = {\n      prompt: 'hola',\n      files: { 'test.txt': 'contenido' },\n      tools: {},\n      manifest: { name: '${name}' },\n    }\n    const { result } = await run(ctx)\n    expect(result).toContain('${name}')\n  })\n\n  it('lista los archivos del workspace', async () => {\n    const ctx = {\n      prompt: 'qué archivos hay',\n      files: { 'a.txt': 'A', 'b.txt': 'B' },\n      tools: {},\n      manifest: { name: '${name}' },\n    }\n    const { result } = await run(ctx)\n    expect(result).toContain('a.txt')\n    expect(result).toContain('b.txt')\n  })\n})\n`,
      },
      {
        path: 'README.md',
        content: `# ${name}\n\nAgente YOLA creado con YOLA Code.\n\n## Contrato\n\nEl agente exporta una función \`run(ctx)\` que recibe:\n- \`ctx.prompt\` — instrucción del usuario\n- \`ctx.files\` — archivos del workspace\n- \`ctx.tools\` — herramientas disponibles\n\nDevuelve \`{ result, files? }\`.\n\n## Test\n\n\`\`\`bash\nnpx vitest run\n\`\`\`\n`,
      },
    ]
  },
}

// ── Template: Nuevo Pipeline ──
const pipelineTemplate = {
  id: 'new-pipeline',
  name: 'Nuevo Pipeline',
  description: 'Pipeline de YOLA: pasos encadenados con entrada/salida de archivos.',
  icon: '⚡',
  category: 'pipeline',
  generate(name) {
    const id = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'mi-pipeline'

    return [
      {
        path: 'manifest.json',
        content: JSON.stringify({
          id,
          name,
          author: 'YOLA',
          repo: `github.com/usuario/${id}`,
          icon: '⚡',
          category: 'Pipelines',
          description: `${name} — pipeline YOLA.`,
          version: '0.1.0',
          type: 'pipeline',
          entry: 'pipeline.js',
          triggers: ['manual', 'webhook'],
        }, null, 2) + '\n',
      },
      {
        path: 'pipeline.js',
        content: `// ── ${name} — Pipeline YOLA ──────────────────────────\n// Contrato: exporta { steps: PipelineStep[] }\n\n/**\n * @typedef {Object} PipelineStep\n * @property {string} id\n * @property {string} name\n * @property {'command'|'agent'|'script'|'condition'} type\n * @property {Object} config\n */\n\n/** @type {PipelineStep[]} */\nexport const steps = [\n  {\n    id: 'step-1',\n    name: 'Paso 1: Preparar',\n    type: 'command',\n    config: {\n      command: 'echo "Pipeline ${name} iniciado"',\n      cwd: '.',\n    },\n  },\n  {\n    id: 'step-2',\n    name: 'Paso 2: Procesar',\n    type: 'agent',\n    config: {\n      agent: 'yola',\n      prompt: 'Procesa los archivos del workspace',\n      inputFiles: ['**/*.js'],\n      outputFiles: ['output/**'],\n    },\n  },\n  {\n    id: 'step-3',\n    name: 'Paso 3: Verificar',\n    type: 'command',\n    config: {\n      command: 'echo "Pipeline completado"',\n      cwd: '.',\n    },\n  },\n]\n`,
      },
      {
        path: 'README.md',
        content: `# ${name}\n\nPipeline YOLA creado con YOLA Code.\n\n## Pasos\n\nEl pipeline ejecuta pasos secuenciales:\n1. Preparar — comando inicial\n2. Procesar — agente YOLA\n3. Verificar — comando final\n`,
      },
    ]
  },
}

/** @type {Template[]} */
export const templates = [appTemplate, agentTemplate, pipelineTemplate]

/**
 * Genera los archivos de un template.
 * @param {string} templateId
 * @param {string} name
 * @returns {TemplateFile[]}
 */
export function generateTemplate(templateId, name) {
  const tpl = templates.find(t => t.id === templateId)
  if (!tpl) throw new Error(`Template no encontrado: ${templateId}`)
  return tpl.generate(name)
}

/**
 * Valida que un nombre de proyecto sea válido.
 * @param {string} name
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateProjectName(name) {
  if (!name || !name.trim()) return { valid: false, error: 'El nombre no puede estar vacío' }
  if (name.length > 64) return { valid: false, error: 'Máximo 64 caracteres' }
  if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ][a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 _-]*$/.test(name.trim())) {
    return { valid: false, error: 'Solo letras, números, espacios, guiones y guiones bajos. Debe empezar con letra.' }
  }
  return { valid: true }
}

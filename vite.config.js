import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

// Build de LIBRERÍA: produce dist/app.js — un bundle ESM AUTOCONTENIDO
// que el App Store de YOLA importa como entry. solid-js y monaco-editor
// viven en dependencies para que Vite los BUNDLEE dentro.
// NOTA: Monaco workers (editor.worker, ts.worker, etc.) se generan como
// archivos separados en dist/assets/ — web workers no pueden ir inline.
// El App Store debe servir todo dist/ como directorio de la app.
export default defineConfig({
  plugins: [solidPlugin()],
  build: {
    lib: {
      entry: 'src/index.jsx',
      formats: ['es'],
      fileName: () => 'app.js',
    },
    outDir: 'dist',
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      // NADA se externaliza: el bundle debe ser 100% autocontenido
      external: [],
    },
  },
  server: {
    port: 5199, // dev aislado (el OS corre en otros puertos)
  },
})

import { rmSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { setEnvPlugin } from './vite-plugins/index.js'

const outDir = 'dist-cli/html'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 5000, // TODO: Reduce this value if possible
    emptyOutDir: true,
    outDir,
    rollupOptions: {
      plugins: [
        {
          // Excludes `schema.json` from the build output as it is generated by the CLI during `erd build`.
          // If `schema.json` exists in the ./public directory, it may be included by Vite, so this ensures it's removed.
          name: 'exclude-schema-json',
          closeBundle() {
            rmSync(`${outDir}/schema.json`, { force: true })
          },
        },
      ],
    },
  },
  plugins: [react(), tsconfigPaths(), setEnvPlugin()],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
})

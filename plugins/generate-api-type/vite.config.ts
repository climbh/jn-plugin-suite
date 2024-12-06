import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './lib/main.ts',
      name: 'generate-api-type',
      fileName: 'generate-api-type',
    },
  },
})

import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'es2017',
  entry: ['src/index.ts'],
  outDir: 'dist',
  clean: true,
  format: ['esm', 'iife'],
  dts: true,
  treeshake: true,
  minify: true,
  splitting: false,
  globalName: 'JnMonitor',
})

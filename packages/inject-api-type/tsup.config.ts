import { defineConfig } from 'tsup'

export default defineConfig({
  target: 'node16',
  entry: ['src/index.ts'],
  outDir: 'dist',
  clean: true,
  format: ['cjs'],
  dts: true,
  treeshake: true,
  minify: true,
  splitting: true,
  external: ['ts-morph'],
})

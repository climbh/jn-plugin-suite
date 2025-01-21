import { defineConfig } from 'tsup'

export default defineConfig(() => {
  // eslint-disable-next-line node/prefer-global/process
  const devMode = process.env.NODE_ENV === 'development'
  return {
    target: 'node16',
    entry: ['src/index.ts'],
    outDir: 'dist',
    clean: true,
    format: ['cjs'],
    dts: true,
    treeshake: true,
    sourcemap: devMode ? 'inline' : false,
  }
})

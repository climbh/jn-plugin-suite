import { defineConfig } from 'tsup'

export default defineConfig({
    target: "node20",
    entry: ['src/index.ts'],
    outDir: 'dist',
    clean: true,
    format: ['cjs'],
    // dts: true,
    treeshake: true,
    sourcemap: true
})
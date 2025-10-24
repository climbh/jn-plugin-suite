import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  target: 'esnext',
  format: ['esm', 'iife'],
  clean: true,
  sourcemap: false,
  minify: true,
  dts: true, // 生成 TypeScript 类型定义文件
  treeshake: true,
  splitting: false,
  globalName: 'JnMonitor', // IIFE 格式的全局变量名
  outExtension({ format }) {
    return {
      js: format === 'iife' ? '.global.js' : '.js'
    }
  },
})
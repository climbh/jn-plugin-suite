import { defineConfig } from 'tsdown'

export default defineConfig(_options => ({
  entry: ['src/index.ts'],
  outDir: 'dist',
  target: 'node20',
  format: ['cjs'], // 保持 CommonJS 格式，适用于 Node.js 环境
  clean: true,
  minify: true,
  dts: true, // 生成 TypeScript 类型定义文件
  treeshake: true,
  splitting: true,
  external: ['ts-morph'], // 保持外部依赖配置
  sourcemap: false,
}))
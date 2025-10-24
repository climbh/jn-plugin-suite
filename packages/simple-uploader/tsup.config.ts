import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/uploader.js'],
  outDir: 'dist',
  target: 'es2016',
  format: ['esm'],
  clean: true,
  sourcemap: true,
  minify: true,
  dts: false, // 由于源码是JS，不生成类型定义
  banner: {
    js: `/*!
 * Uploader - Uploader library implements html5 file upload and provides multiple simultaneous, stable, fault tolerant and resumable uploads
 * @version v0.6.0
 * @author dolymood <dolymood@gmail.com>
 * @link https://github.com/simple-uploader/Uploader
 * @license MIT
 */`
  }
})
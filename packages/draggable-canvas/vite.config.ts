import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue(),
      dts({
        insertTypesEntry: true,
        copyDtsFiles: false,
        outDir: 'dist',
        entryRoot: 'src',
        // 合并所有类型到一个文件
        rollupTypes: true,
      }),
    ],
    build: {
      lib: {
        entry: 'src/index.ts',
        name: 'DraggableCanvas',
        fileName: format => `draggable-canvas.${format}.js`,
        formats: ['es'],
      },
      rollupOptions: {
        external: [
          'vue',
          // '@iconify/vue',
          // '@tiptap/pm',
          // '@tiptap/starter-kit',
          // '@tiptap/vue-3',
        ],
      },
      outDir: 'dist',
      emptyOutDir: true,
      minify: mode === 'production' ? 'esbuild' : false,
      cssCodeSplit: true,
      // 禁用 source map
      sourcemap: false,
    },
  }
})

<script lang="ts" setup>
import type { ComputedRef } from 'vue'
import type { Rect } from '../../types'
import { Icon } from '@iconify/vue'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { Highlight } from '@tiptap/extension-highlight'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { StarterKit } from '@tiptap/starter-kit'
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/vue-3'
import { defineEmits, defineProps, inject, onUnmounted } from 'vue'
import { convertStylePxToRem } from '../../utils'
import Select from '../Select.vue'
import { FontSize } from './fontsize'

const props = defineProps<{
  rect: Rect
}>()
const emit = defineEmits(['update'])

const production = inject<ComputedRef<boolean>>('draggableCanvasProduction')

const editor = useEditor({
  content: production?.value ? convertStylePxToRem(props.rect.content || '') : props.rect.content || '',
  autofocus: true,
  editable: !production?.value,
  extensions: [
    StarterKit,
    FontFamily,
    Placeholder.configure({
      placeholder: '请输入内容...',
      // 可选：根据节点类型显示不同提示
      emptyNodeClass: 'is-empty',
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Highlight,
    TextStyle,
    FontSize,
    Color,

  ],
  onUpdate({ editor }) {
    emit('update', props.rect.id, editor.getHTML())
  },
})

onUnmounted(() => {
  editor.value?.destroy()
})

const minFontSize = 12
const maxFontSize = 100
const fontSizes = getFontSizes(minFontSize, maxFontSize)
const fontSizeMap = fontSizes.map(item => ({ label: `${item}px`, value: item }))
const colors = ['#000000', '#e53935', '#8e24aa', '#3949ab', '#039be5', '#43a047', '#fbc02d', '#fb8c00', '#ffffff']

function getCurrentFontSize(): number {
  if (!editor.value)
    return 16
  const attrs = editor.value.getAttributes('textStyle')
  const size = attrs.fontSize ? Number.parseInt(String(attrs.fontSize).replace('px', ''), 10) : 16
  return fontSizes.includes(size) ? size : 16
}

const fontSizeSpeed = 2
function changeFontSize(type: 'inc' | 'dec' | 'size', size: number) {
  if (!editor.value)
    return
  if (type === 'size') {
    editor.value.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run()
    return
  }
  const current = getCurrentFontSize()
  const idx = fontSizes.indexOf(current)
  let nextIdx = idx
  if (type === 'inc' && idx < fontSizes.length - 1)
    nextIdx = idx + 1
  if (type === 'dec' && idx > 0)
    nextIdx = idx - 1
  const next = fontSizes[nextIdx]
  editor.value.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).run()
}

function getFontSizes(min: number, max: number): number[] {
  const arr: number[] = []
  for (let i = min; i <= max; i += fontSizeSpeed) {
    arr.push(i)
  }
  return arr
}

const fontFamilies = [
  { label: '默认', value: '' },
  { label: '微软雅黑', value: 'Microsoft YaHei,Helvetica Neue,PingFang SC,sans-serif' },
  { label: '苹果苹方', value: 'PingFang SC,Microsoft YaHei,sans-serif' },
  { label: '宋体', value: 'simsun,serif' },
  { label: '仿宋体', value: 'FangSong,serif' },
  { label: '方正仿宋_GBK', value: 'FZFangSong-Z02' },
  { label: '方正小标宋_GBK', value: 'FZXiaoBiaoSong-B05,方正小标宋,serif' },
  { label: '方正黑体_GBK', value: 'FZHei-B01' },
  { label: '方正楷体_GBK', value: 'FZKai-Z03' },
  { label: '方正舒体', value: 'FZShuTi' },
  { label: '方正姚体', value: 'FZYaoTi-M06' },
  { label: '黑体', value: 'SimHei,sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Arial', value: 'arial,helvetica,sans-serif' },
  { label: 'Arial Black', value: 'arial black,avant garde' },
  { label: 'Book Antiqua', value: 'book antiqua,palatino' },
]

function changeFontFamily(val: any) {
  if (!editor.value)
    return
  const font = val
  editor.value.commands.setFontFamily(font)
}
</script>

<template>
  <div v-if="editor" class="editor-container">
    <BubbleMenu
      class="bubble-menu"
      :tippy-options="{ duration: 100 }"
      :editor="editor"
    >
      <div class="control-group">
        <div class="button-toolbar">
          <!-- 字体切换 -->
          <div class="btn-group font-family-group">
            <Select
              :value="editor?.getAttributes('textStyle').fontFamily || ''"
              :font-family="true"
              placeholder="选择字体"
              :options="fontFamilies"
              @change="changeFontFamily"
            />
            <button :class="{ 'is-active': editor?.isActive('bold') }" @click="editor && editor.chain().focus().toggleBold().run()">
              <Icon icon="proicons:text-bold" width="24" height="24" />
            </button>
            <button :class="{ 'is-active': editor?.isActive('italic') }" @click="editor && editor.chain().focus().toggleItalic().run()">
              <Icon icon="mingcute:italic-fill" width="24" height="24" />
            </button>
            <button :class="{ 'is-active': editor?.isActive('strike') }" @click="editor && editor.chain().focus().toggleStrike().run()">
              <Icon icon="material-symbols:format-strikethrough-rounded" width="24" height="24" />
            </button>
          </div>
          <div class="btn-group">
            <!-- <select class="select" :value="getCurrentFontSize()" @change="changeFontSize('size', $event)">
              <option v-for="size in fontSizes" :key="size" :value="size">
                {{ size }}px
              </option>
            </select> -->
            <Select
              :value="getCurrentFontSize()"
              :options="fontSizeMap"
              :searchable="true"
              @change="(val) => changeFontSize('size', Number(val))"
            />
            <button :class="{ 'is-active': editor?.isActive({ textAlign: 'left' }) }" @click="editor && editor.chain().focus().setTextAlign('left').run()">
              <Icon icon="fluent:align-left-28-filled" width="24" height="24" />
            </button>
            <button :class="{ 'is-active': editor?.isActive({ textAlign: 'center' }) }" @click="editor && editor.chain().focus().setTextAlign('center').run()">
              <Icon icon="fluent:align-center-vertical-24-filled" width="24" height="24" />
            </button>
            <button :class="{ 'is-active': editor?.isActive({ textAlign: 'right' }) }" @click="editor && editor.chain().focus().setTextAlign('right').run()">
              <Icon icon="fluent:align-right-28-filled" width="24" height="24" />
            </button>
            <!-- 字号 -->
            <!-- <button class="font-size-btn" @mousedown.prevent="changeFontSize('dec')">
              <Icon icon="fluent:font-decrease-24-filled" width="24" height="24" />
            </button> -->

            <!-- <button class="font-size-btn" @mousedown.prevent="changeFontSize('inc')">
              <Icon icon="fluent:font-increase-24-filled" width="24" height="24" />
            </button> -->
          </div>
          <!-- 颜色 -->
          <div class="btn-group color-group">
            <div class="color-palette">
              <span v-for="color in colors" :key="color" :style="{ background: color }" class="color-dot" @click="editor && editor.chain().focus().setColor(color).run()" />
              <input type="color" @change="(e) => editor && editor.chain().focus().setColor((e.target as HTMLInputElement)?.value).run()">
            </div>
          </div>
        </div>
      </div>
    </BubbleMenu>
    <EditorContent class="editor" :editor="editor" />
  </div>
</template>

<style lang="scss" scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

:deep(.editor) {
  background: transparent !important;
  .ProseMirror {
    outline: none;
    font-family: inherit;
  }
  .is-empty:first-child::before {
    float: left;
    height: 0;
    color: #adb5bd;
    content: attr(data-placeholder);
    pointer-events: none;
  }
  .font-family-select {
    font-family: inherit !important;
    option {
      font-family: none !important;
    }
  }
}

.control-group {
  margin-bottom: 8px;
}

.button-toolbar {
  padding: 8px 12px;
  border-radius: 6px;
  background: #f9f9f9;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);

  gap: 4px;
}

.btn-group {
  display: flex;
  align-items: center;

  gap: 4px;
  + .btn-group {
    margin-top: 8px;
  }
}

.divider {
  width: 1px;
  height: 28px;
  margin: 0 12px;
  border-radius: 1px;
  background: #e0e0e0;
}

.button-toolbar button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  background: #f0f0f0;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  &.is-active {
    color: #ffffff;
    background: #409eff;
  }
  &:hover {
    background: #e6f0ff;
  }
}

.font-size-group {
  gap: 2px;
  .font-size-btn {
    width: 32px;
    height: 32px;
    margin: 0 2px;
    padding: 0;
    color: #333333;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    background: #f0f0f0;
    font-size: 16px;
    font-weight: bold;
    &:hover {
      color: #409eff;
      background: #e6f0ff;
    }
  }
  .font-size-input {
    display: block;
    box-sizing: border-box;
    width: 48px;
    height: 100%;
    margin: 0 2px;
    color: #333333;
    border: 1px solid #e0e0e0;
    border-radius: 50%;
    outline: none;
    background: #f0f0f0;
    font-size: 16px;
    font-weight: bold;
    transition: border 0.2s, background 0.2s, color 0.2s;
    text-align: center;
    &:hover, &:focus {
      color: #409eff;
      border: 1.5px solid #409eff;
      background: #e6f0ff;
    }
  }
}

.color-group {
  .color-palette {
    display: flex;
    align-items: center;

    gap: 4px;
    .color-dot {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 1.5px solid #e0e0e0;
      border-radius: 50%;
      cursor: pointer;
      transition: border 0.2s;
      &:hover {
        border: 1.5px solid #409eff;
      }
    }
  }
}

.editor {
  width: 100%;
  height: 100%;
  padding: 8px;
  border-radius: 4px;
  outline: none;
  background: #ffffff;
  font-size: 15px;
  user-select: auto;
  pointer-events: auto;
  div, p {
    outline: none;
  }
}

.select {
  min-width: 110px;
  height: 32px;
  margin-right: 8px;
  padding: 0 8px;
  color: #333333;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  outline: none;
  background: #f0f0f0;
  font-size: 14px;
  &:hover, &:focus {
    background: #e6f0ff;
  }
}

.font-size-select {
  width: 75px;
  min-width: 75px;
}
</style>

<style>
input[type='number']::-webkit-outer-spin-button, input[type='number']::-webkit-inner-spin-button {
  margin: 0;

  -webkit-appearance: none;
}
/* Firefox 隐藏箭头 */
input[type='number'] {
  -moz-appearance: textfield;
}

.tippy-box {
  width: auto !important;
  max-width: none !important;
}
</style>

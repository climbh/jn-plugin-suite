<script lang="ts" setup>
import type { ComputedRef } from 'vue'
import type { Rect } from '../../types'
import { defineEmits, defineProps, inject, ref, watch } from 'vue'
import { CanvasItemType } from '../../enum'

const props = defineProps<{
  rect: Rect
}>()
const emit = defineEmits(['update'])

const production = inject<ComputedRef<boolean>>('draggableCanvasProduction')
const transformContentHandle = inject<(type: CanvasItemType, data: any) => Promise<any>>('transformContent')

const fileInput = ref<HTMLInputElement | null>(null)
const localUrl = ref(props.rect.content || '')
const loading = ref(false)

watch(() => props.rect.content, (val) => {
  localUrl.value = val || ''
})

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    const file = files[0]
    if (!transformContentHandle) {
      console.warn('%c [ upload ]', 'font-size:13px; background:blue; color:#fff;', 'DraggableCanvas组件请确保传入transformContent函数来处理图片上传')
      return
    }
    if (!file)
      return
    loading.value = true
    transformContentHandle?.(CanvasItemType.Background, file).then((url) => {
      localUrl.value = url
      emit('update', props.rect.id, url)
    }).catch(() => {
      localUrl.value = ''
      emit('update', props.rect.id, '')
    }).finally(() => {
      loading.value = false
    })
  }
}
</script>

<template>
  <div class="background" :class="{ production }">
    <div v-if="!localUrl && !production" class="upload-area" @click="triggerUpload">
      <template v-if="!loading">
        <span>点击上传背景图片</span>
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange">
      </template>
      <div v-else class="loading">
        图片处理中...
      </div>
    </div>
    <div v-else class="img-area">
      <img draggable="false" :src="localUrl" class="bg-img">
      <button v-if="!production && !rect._prevRect" class="reupload-btn" @click.stop="triggerUpload">
        重新上传
      </button>
      <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange">
    </div>
  </div>
</template>

<style lang="scss" scoped>
.background, .upload-area, .img-area {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
}
.bg-img {
  width: 100%;
  height: 100%;
  cursor: pointer;

  object-fit: cover;
}
.reupload-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 10px;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  background: rgba(0,0,0,0.5);
  cursor: pointer;
}
.upload-area {
  position: relative;
  color: #409eff;
  border: 1.5px dashed #409eff;
  border-radius: 4px;
  background: #f6faff;
  font-size: 14px;
  cursor: pointer;
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    width: 100%;
    height: 100%;
    color: #ffffff;
    background-color: rgba(0,0,0,0.5);
    font-size: 16px;

    inset: 0;
  }
}
</style>

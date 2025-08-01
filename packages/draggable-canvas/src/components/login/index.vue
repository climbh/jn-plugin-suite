<script lang="ts" setup>
import type { Ref } from 'vue'
import type { Rect } from '../../types'
import { inject, nextTick, onMounted, ref } from 'vue'

const props = defineProps<{
  rect: Rect
}>()

const emits = defineEmits(['updateLoginSize'])
const loginContent = ref<HTMLElement>()
const production = inject<Ref<boolean>>('draggableCanvasProduction')
const mode = inject<Ref<boolean>>('draggableCanvasMode')

const loginWapperOutPadding = 6

onMounted(() => {
  // nextTick 是为了确保 loginContent 已经渲染完成拿到真实的内容信息
  nextTick(() => {
    const loginContainerWidth = loginContent.value?.querySelector('.guard-content-wrapper')?.clientWidth
    const loginContainerHeight = loginContent.value?.querySelector('.guard-content-wrapper')?.clientHeight
    if (!loginContainerWidth || !loginContainerHeight)
      return
    if (production?.value)
      return
    if (props.rect.width >= loginContainerWidth! && props.rect.height >= loginContainerHeight!)
      return
    emits('updateLoginSize', props.rect.id, {
      width: loginContainerWidth + loginWapperOutPadding,
      height: loginContainerHeight + loginWapperOutPadding,
    })
  })
})
</script>

<template>
  <div ref="loginContent" class="login" :class="[mode]">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.login {
  font-size: 16px;
  &::before {
    position: absolute;
    z-index: 999;
    content: '';

    inset: 0;
  }
}

.production {
  &::before {
    display: none;
  }
}
</style>

import { debounce } from 'lodash-es'
import { ref } from 'vue'
import { getRootSize } from '../utils/window'

let pageSizeSingleton: ReturnType<typeof createPageSize> | null = null

function createPageSize() {
  const rootFontSize = ref(getRootSize())

  window.addEventListener('resize', debounce(() => {
    rootFontSize.value = getRootSize()
  }, 100))

  return {
    rootFontSize,
  }
}

function usePageSize() {
  if (!pageSizeSingleton) {
    pageSizeSingleton = createPageSize()
  }
  return pageSizeSingleton
}

export default usePageSize

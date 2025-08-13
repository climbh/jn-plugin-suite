const rootValue = 100 // 根数值  1rem = 100px
const baseSize = 1920 // 设计稿基础尺寸 1920 基准
const minClientWidth = 500 // 适配的最小 屏幕 500（移动端）
/**
 * 适配最大屏幕，注：市场上更多的高分辨率屏幕，如果宽度过大，同样会导致基准过大，暂时先最高适配到 1920
 * c 端存在版心，保持 1920 最大适配
 */
const maxClientWidth = 5280

const docEl = document.documentElement
const resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize'

function recalc() {
  const clientWidth = docEl.clientWidth

  let ratio = 1
  if (clientWidth >= minClientWidth && clientWidth <= maxClientWidth) {
    ratio = clientWidth / baseSize
  }
  else if (clientWidth < minClientWidth) {
    ratio = minClientWidth / baseSize
  }
  else if (clientWidth > maxClientWidth) {
    ratio = maxClientWidth / baseSize
  }
  // rem
  docEl.style.fontSize = `${rootValue * ratio}px`
}

// 监听 resize 事件
window.addEventListener(resizeEvt, recalc, false)

// 根据文档加载状态决定执行时机
if (document.readyState === 'loading') {
  // 如果文档还在加载，等待 DOMContentLoaded
  document.addEventListener('DOMContentLoaded', recalc, false)
}
else {
  // 如果文档已经加载完成，立即执行
  recalc()
}

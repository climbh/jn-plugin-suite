export function getGlobalWindow() {
  return window.top || window
}

export function getRootSize() {
  return Number(getGlobalWindow().document.documentElement.style.fontSize?.replace('px', '') || 100)
}

import type { CanvasItemType } from './enum'

export interface CanvasItem {
  id: string
  x: number
  y: number
  content: string
}

export interface Rect {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: CanvasItemType
  originalPageSize: {
    width: number
    height: number
    rootSize: number
  }
  content?: string
  /**
   * 全屏前的原始位置和尺寸，仅内部使用
   */
  _prevRect?: {
    x: number
    y: number
    width: number
    height: number
  }
}

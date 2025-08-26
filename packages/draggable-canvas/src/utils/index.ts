import type { Rect } from '../types'
import { cloneDeep } from 'lodash-es'
import { CanvasItemType } from '../enum'
import usePageSize from '../hooks/usePageSize'
import { getRootSize } from './window'

// ==================== 类型定义 ====================

/**
 * 尺寸对象接口
 */
export interface Size {
  width: number
  height: number
}

/**
 * 比例对象接口
 */
export interface Ratio {
  x: number
  y: number
}

/**
 * 位置类型
 */
export type PositionType = 'left' | 'top' | 'width' | 'height'

/**
 * 尺寸键类型
 */
export type DimensionKey = 'width' | 'height' | 'x' | 'y'

/**
 * 单位类型
 */
export type UnitType = 'px' | 'rem' | '%' | ''

/**
 * 转换配置接口
 */
export interface TransformConfig {
  production: boolean
  canvasSize: Size
  rootFontSize: number
  rootSize: number
}

// ==================== 常量定义 ====================

/**
 * 特殊值常量
 */
export const SPECIAL_VALUES = {
  AUTO_HEIGHT: -100,
  FULL_SCREEN: '100%',
} as const

/**
 * 正则表达式
 */
export const REGEX = {
  PX_UNIT: /(\d*px)/g,
} as const

// ==================== 核心工具函数 ====================

/**
 * 计算两个尺寸之间的比例
 * @param originalSize 原始尺寸
 * @param currentSize 当前尺寸
 * @returns 包含x和y轴比例的Ratio对象
 */
export function calculateRatio(originalSize: Size, currentSize: Size): Ratio {
  return {
    x: currentSize.width / originalSize.width,
    y: currentSize.height / originalSize.height,
  }
}

/**
 * 获取窗口尺寸
 * @returns 包含客户端宽度和高度的Size对象
 */
export function getWindowSize(): Size {
  return {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
  }
}

/**
 * 根据组件类型和属性类型确定单位
 * @param rect 矩形对象
 * @param type 位置类型
 * @param production 是否生产环境
 * @returns 单位字符串
 */
export function getUnitByType(rect: Rect, type: PositionType, production: boolean): UnitType {
  // 全屏组件的宽高使用百分比
  if (rect._prevRect && (type === 'width' || type === 'height')) {
    return '%'
  }

  // 登录组件在生产环境下的高度不使用单位
  if (rect.type === CanvasItemType.Login && production && type === 'height') {
    return ''
  }

  // 默认根据环境返回对应单位
  return production ? 'rem' : 'px'
}

/**
 * 计算像素值，考虑特殊组件和环境的处理
 * @param rect 矩形对象
 * @param key 尺寸键
 * @param ratio 缩放比例
 * @param production 是否生产环境
 * @param _originalRootSize 原始根字体大小
 * @returns 计算后的像素值
 */
export function calculatePixelValue(
  rect: Rect,
  key: DimensionKey,
  ratio: number,
  production: boolean,
  _originalRootSize: number,
): number {
  const pixelValue = rect[key]
  const scaledPixel = pixelValue * ratio

  // 登录组件在生产环境下的高度特殊处理
  if (rect.type === CanvasItemType.Login && production) {
    if(key === 'width') {
      return SPECIAL_VALUES.AUTO_HEIGHT
    }
    return SPECIAL_VALUES.AUTO_HEIGHT
  }

  // 全屏组件的宽高使用百分比
  if (rect._prevRect && (key === 'width' || key === 'height')) {
    return 100
  }

  // 生产环境转换为rem基准值
  if (production) {
    const currentRootSize = getRootSize()
    return scaledPixel / currentRootSize
  }

  return scaledPixel
}

/**
 * 计算缩放比例（仅用于Login组件）
 * @param xRatio X轴比例
 * @param yRatio Y轴比例
 * @param production 是否生产环境
 * @param rect 矩形对象
 * @returns 缩放比例
 */
export function calculateScale(xRatio: number, yRatio: number, production: boolean, rect: Rect): number {
  if (!production || rect.type !== CanvasItemType.Login) {
    return 1
  }
  return Math.min(xRatio, yRatio)
}

// ==================== 单位转换函数 ====================

/**
 * 将CSS样式中的px单位转换为rem
 * @param content CSS样式内容
 * @returns 转换后的CSS内容
 */
export function convertStylePxToRem(content: string): string {
  if (!content || content.trim() === '') {
    return ''
  }

  const { rootFontSize } = usePageSize()

  return content.replace(REGEX.PX_UNIT, (match) => {
    const value = Number(match.replace('px', ''))
    return `${value / Number(rootFontSize.value)}rem`
  })
}

/**
 * 转换数值为CSS单位值
 * @param value 数值
 * @returns CSS单位值字符串
 */
export function convertValueToUnit(value: number): string {
  if (value === SPECIAL_VALUES.AUTO_HEIGHT) {
    return 'auto'
  }
  return `${value}`
}

// ==================== 矩形转换函数 ====================

/**
 * 转换矩形数组以适应新的屏幕尺寸
 * @param rects 原始矩形数组
 * @param targetSize 目标尺寸
 * @param production 是否生产环境
 * @returns 转换后的矩形数组
 */
export function transformRectsToSize(rects: Rect[], targetSize: Size, production: boolean): Rect[] {
  const transformedRects = cloneDeep(rects)

  transformedRects.forEach((rect, index) => {
    const { _prevRect, originalPageSize } = rect

    // 计算缩放比例
    const ratio = calculateRatio(
      { width: originalPageSize.width, height: originalPageSize.height },
      targetSize,
    )

    // 转换主要属性
    const width = calculatePixelValue(rect, 'width', ratio.x, production, originalPageSize.rootSize)
    const height = calculatePixelValue(rect, 'height', ratio.y, production, originalPageSize.rootSize)
    const x = calculatePixelValue(rect, 'x', ratio.x, production, originalPageSize.rootSize)
    const y = calculatePixelValue(rect, 'y', ratio.y, production, originalPageSize.rootSize)

    // 更新矩形对象
    transformedRects[index] = {
      ...rect,
      width,
      height,
      x,
      y,
      originalPageSize: {
        width: targetSize.width,
        height: targetSize.height,
        rootSize: getRootSize(),
      },
    }

    // 处理全屏前的原始位置和尺寸
    if (_prevRect) {
      const prevWidth = _prevRect.width * ratio.x
      const prevHeight = _prevRect.height * ratio.y
      const prevX = _prevRect.x * ratio.x
      const prevY = _prevRect.y * ratio.y

      // 生产环境下转换为rem基准值
      const currentRootSize = getRootSize()
      transformedRects[index]._prevRect = {
        width: production ? prevWidth / currentRootSize : prevWidth,
        height: production ? prevHeight / currentRootSize : prevHeight,
        x: production ? prevX / currentRootSize : prevX,
        y: production ? prevY / currentRootSize : prevY,
      }
    }
  })

  return transformedRects
}

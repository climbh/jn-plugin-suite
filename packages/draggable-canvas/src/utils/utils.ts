import { Rect } from "../types"

/**
 * 深度克隆函数
 * 支持常见对象类型（数组、对象、Date、RegExp、Map、Set等），避免循环引用
 * @param target 需要克隆的目标对象
 * @param map 用于处理循环引用的WeakMap
 * @returns 深度克隆后的新对象
 */
export function deepClone<T>(target: T, map: WeakMap<any, any> = new WeakMap()): T {
  // 基本类型直接返回
  if (typeof target !== 'object' || target === null) {
    return target
  }

  // 处理循环引用
  if (map.has(target)) {
    return map.get(target)
  }

  let clone: any

  // 处理特殊对象
  if (target instanceof Date) {
    clone = new Date(target)
  }
  else if (target instanceof RegExp) {
    clone = new RegExp(target)
  }
  else if (target instanceof Map) {
    clone = new Map()
    map.set(target, clone)
    target.forEach((value, key) => {
      clone.set(deepClone(key, map), deepClone(value, map))
    })
    return clone
  }
  else if (target instanceof Set) {
    clone = new Set()
    map.set(target, clone)
    target.forEach((value) => {
      clone.add(deepClone(value, map))
    })
    return clone
  }
  else if (Array.isArray(target)) {
    clone = []
    map.set(target, clone)
    ;(target as any[]).forEach((item, idx) => {
      clone[idx] = deepClone(item, map)
    })
    return clone
  }
  else {
    clone = Object.create(Object.getPrototypeOf(target))
    map.set(target, clone)
    Object.keys(target).forEach((key) => {
      clone[key] = deepClone((target as any)[key], map)
    })
    return clone
  }

  map.set(target, clone)
  return clone
}


// 记录全屏前的矩形信息
export function isRectFullscreen(rect: Rect): boolean {
  return rect.x === 0 && rect.y === 0 && rect.width === 100 && rect.height === 100
}
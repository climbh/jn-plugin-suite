import type { _RouteRecordBase, RouteComponent, RouteMeta, RouteRecordNormalized } from 'vue-router'
import { getMonitorInstance } from '../core/instance'

/**
 * 深度合并对象
 * @param data
 * @param defaultData
 */
export function mergeData(data: Record<string, any>, defaultData: Record<string, any>) {
  const result: any = {}

  for (const key in defaultData) {
    if (Object.prototype.hasOwnProperty.call(defaultData, key)) {
      if (
        defaultData[key]
        && typeof defaultData[key] === 'object'
        && !Array.isArray(defaultData[key])
        && data
        && typeof data[key] === 'object'
        && !Array.isArray(data[key])
      ) {
        result[key] = mergeData(data[key], defaultData[key])
      }
      else {
        result[key] = data && data[key] !== null && data[key] !== undefined ? data[key] : defaultData[key]
      }
    }
  }
  return result
}

/**
 * 解析路由
 * @param path 路由路径
 * @returns 解析后的路由路径
 */
export function parseRoute(path: string) {
  return path.replace(/\/views/, '').replace(/\/index.vue/, '')
}

export interface RouteConfig {
  path: _RouteRecordBase['path']
  meta: RouteMeta
  name?: _RouteRecordBase['name']
  component?: RouteComponent | Lazy<RouteComponent>
  children?: RouteConfig[]
  redirect?: _RouteRecordBase['redirect']
  alias?: _RouteRecordBase['alias']
  props?: RouteRecordNormalized['props'] | true
  beforeEnter?: _RouteRecordBase['beforeEnter']
  id?: string
}
type Lazy<T> = () => Promise<T>
/**
 * 查找节点
 * @param tree 树
 * @param cb 回调函数
 */
export function findNodeBy(tree: RouteConfig[], value: any, key: keyof RouteConfig = 'id'): RouteConfig | null {
  for (const node of tree) {
    if (node[key] === value)
      return node
    if (node.children && node.children.length > 0) {
      const result = findNodeBy(node.children, value, key)
      if (result)
        return result
    }
  }
  return null
}

// 深度优先查找，根据path来查找到对应的数据，包括他的父元素们
/**
 * 深度优先查找节点及其所有父节点
 * @param tree 路由树
 * @param path 目标路径
 * @param parentNodes 父节点数组(内部递归使用)
 * @returns 包含目标节点及其所有父节点的数组
 */
export function findNodeAndParentsByPath(
  tree: RouteConfig[],
  id: string,
  parentNodes: RouteConfig[] = [],
): RouteConfig[] | null {
  for (const node of tree) {
    // 当前路径匹配
    if (node.meta?.funcId === id) {
      return [...parentNodes, node]
    }

    // 有子节点则继续递归查找
    if (node.children && node.children.length > 0) {
      const result = findNodeAndParentsByPath(
        node.children,
        id,
        [...parentNodes, node],
      )
      if (result) {
        return result
      }
    }
  }
  return null
}

/**
 * 生成 UUID 的兼容性函数
 * 优先使用 crypto.randomUUID，如果不支持则使用兼容方案
 */
export function generateUUID(): string {
  // 优先使用 crypto.randomUUID（如果支持）
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 兼容方案：使用 crypto.getRandomValues 生成 UUID v4
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)

    // 设置版本位 (版本 4)
    array[6] = (array[6] & 0x0F) | 0x40
    // 设置变体位
    array[8] = (array[8] & 0x3F) | 0x80

    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-')
  }

  // 最后的降级方案：使用 Math.random（不推荐用于生产环境）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 替换路径
 * @param path 路径
 * @returns 替换后的路径
 */
export function replacePath(path: string) {
  return path.replace(/\/merge/, '')
}

export function urlHashString() {
  return location.hash.replace('#', '')
}

/**
 * 将查询参数转换为 URL 参数
 * @param query 查询参数
 * @returns URL 参数
 */
export function queryTransform2UrlParams(query: any) {
  if (Object.keys(query).length === 0)
    return ''
  return `?${Object.entries(query).map(([key, value]) => `${key}=${value}`).join('&')}`
}

export function isLoginPage() {
  // 之所以这么取值是因为在某些浏览器版本中获取到的url会是 /login, 即使当前页面不是login
  const currentPath = JSON.parse(localStorage.getItem('vuex') || '{}')?.currentStatus?.currentPath
  return (currentPath && currentPath === '/login')
}

/**
 * 获取window对象
 * @returns 当前窗口
 */
export function getWindow() {
  return window.top ?? window
}

/**
 * 获取当前窗口的 origin
 * @returns 当前窗口的 origin
 */
export function getOrigin() {
  const _window = getWindow()
  const { origin, pathname } = _window.location
  return `${origin + pathname}#`
}

/**
 * 替换服务器URL中的user_id参数
 */
export function replaceServerUrl(userId: string) {
  const monitorInstance = getMonitorInstance()
  if (!monitorInstance)
    return
  const serverUrl = monitorInstance?.para?.server_url || ''
  const orginUrl = serverUrl.split('?')[0]
  if (userId) {
    monitorInstance.para.server_url = `${orginUrl}?user_id=${userId}`
    return
  }
  monitorInstance.para.server_url = orginUrl
}

/**
 * 是否是合法的url
 */
export function isUrlValid(url: string) {
  try {
    const _ = new URL(url)
    return true
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (error) {
    return false
  }
}

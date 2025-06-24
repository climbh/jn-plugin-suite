import type { _RouteRecordBase, RouteComponent, RouteMeta, RouteRecordNormalized } from 'vue-router'
import useApp from '../hooks/useApp'

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
  path: string,
  parentNodes: RouteConfig[] = [],
): RouteConfig[] | null {
  for (const node of tree) {
    // 当前路径匹配
    if (node.path === path) {
      return [...parentNodes, node]
    }

    // 有子节点则继续递归查找
    if (node.children && node.children.length > 0) {
      const result = findNodeAndParentsByPath(
        node.children,
        path,
        [...parentNodes, node],
      )
      if (result) {
        return result
      }
    }
  }
  return null
}

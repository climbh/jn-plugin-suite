import type { RouteConfig } from '../utils'
import useApp from '../hooks/useApp'
import { findNodeBy } from '../utils'
import { registerSuperProperties } from './event'
import { getMonitorInstance } from './instance'

const monitorInstance = getMonitorInstance()

/**
 * 关联用户
 * @param userId 用户id
 * @description 关联用户, 用于后续的分析, 在用户登录后调用
 */
export const addLogin = (userId: string): void => monitorInstance?.login(userId)

/**
 * 取消用户关联
 * @description 取消用户关联, 在用户退出登录后调用
 */
export function loginOut() {
  monitorInstance?.logout()
  registerSuperProperties({
    $institu_id: '',
    $user_id: '',
    $authorization: '',
    $menu_id: '',
  })
}

/**
 * 补充菜单信息
 * @param path 路由路径
 * @description 补充菜单信息, 用于上报页面信息
 */
let _routerConfigs: RouteConfig[] = []
let beforeMenuId = ''
export function addMenuInfo(path: string) {
  const { routeConfigs } = useApp().$store.state.appFuncTree
  if (Object.keys(routeConfigs).length > 0)
    _routerConfigs = routeConfigs
  const node = findNodeBy(_routerConfigs, path, 'path')
  const menuId = (node?.meta.funcId as string) || ''
  registerSuperProperties({ $menu_id: menuId })
  registerSuperProperties({ $menu_id_before: beforeMenuId })

  // 查到菜单id, 并且不是当前的菜单
  if (menuId && beforeMenuId !== menuId)
    beforeMenuId = menuId

  // 没有菜单id, 清空
  if (!menuId)
    beforeMenuId = ''
}

/**
 * 上报信息中添加用户信息
 */
export function loginHandle(userId?: string) {
  const $store = useApp().$store
  const { instituInfo, loginInfo } = $store.state.currentUserInfo
  const { access_token } = $store.state.loginInfo
  const _userId = userId || loginInfo.userId

  if (!_userId)
    return

  addLogin(_userId)
  registerSuperProperties({
    $institu_id: instituInfo.instituId,
    $user_id: _userId,
    $authorization: access_token,
  })
}

/**
 * 退出登录, 清空上报信息中的登录用户信息
 */
export const loginOutHandle = loginOut

import type { RouteConfig } from '../utils'
import useApp from '../hooks/useApp'
import { findNodeBy } from '../utils'
import { addRegisterProperty } from './event'
import { sensorsInstance } from './instance'

/**
 * 关联用户
 * @param userId 用户id
 * @description 关联用户, 用于后续的分析, 在用户登录后调用
 */
export function addLogin(userId: string): void {
  sensorsInstance.login(userId)
}

/**
 * 取消用户关联
 * @description 取消用户关联, 在用户退出登录后调用
 */
export function loginOut() {
  sensorsInstance.logout()
}

/**
 * 补充菜单信息
 * @param to 路由信息
 * @description 补充菜单信息, 用于上报页面信息
 */
let _routerConfigs: RouteConfig[] = []
export function addMenuInfo(path: string) {
  const { $store } = useApp()
  const { routeConfigs } = $store.state.appFuncTree

  if (Object.keys(routeConfigs).length > 0) {
    _routerConfigs = routeConfigs
  }
  const node = findNodeBy(_routerConfigs, path, 'path')
  if (node) {
    // 获取菜单的id
    addRegisterProperty({
      menuId: node.meta.funcId,
    })
  }
  else {
    addRegisterProperty({
      menuId: '',
    })
  }
}

// 上报信息中添加用户信息
export function loginHandle(userId?: string) {
  const { $store } = useApp()
  const { instituInfo, loginInfo } = $store.state.currentUserInfo
  const _useId = userId || loginInfo.userId
  if (!_useId)
    return
  addLogin(_useId)
  addRegisterProperty({
    instituId: instituInfo.instituId,
    useId: _useId,
  })
}

// 退出登录, 清空上报信息中的登录用户信息(清空后则为匿名, 匿名的默认的)
export function loginOutHandle() {
  loginOut()
}

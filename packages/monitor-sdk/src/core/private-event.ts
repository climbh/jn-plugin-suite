import type { RouteConfig } from '../utils'
import type { SuperProperties } from './types'
import useApp from '../hooks/useApp'
import { findNodeAndParentsByPath, replacePath, replaceServerUrl } from '../utils'
import { registerSuperProperties } from './event'
import { getMonitorInitialized, getMonitorInstance, getRouterMapping } from './instance'

const monitorInstance = getMonitorInstance()

/**
 * 补充菜单信息
 * @param path 路由路径
 * @description 补充菜单信息, 用于上报页面信息
 */
let _routerConfigs: RouteConfig[] = []
let beforeMenuId = ''
let beforeMenuParentIds: string[] = []
export function addMenuInfo(path: string) {
  if (_routerConfigs.length === 0) {
    _routerConfigs = useApp().$store.state.appFuncTree.routeConfigs
  }
  const routerMapping = getRouterMapping()
  if (!routerMapping || (routerMapping && Object.keys(routerMapping).length === 0))
    return
  const _path = replacePath(path)
  const node = routerMapping[_path] ?? null
  const parentNodes = node ? findNodeAndParentsByPath(_routerConfigs, node.meta.funcId as string)?.slice(0, -1) : []
  const menuId = node ? (node.meta.funcId as string) : ''
  const parentIds: string[] = parentNodes?.map(i => (i.meta?.funcId || '') as string) ?? []

  registerSuperProperties({ $menu_id: menuId })
  registerSuperProperties({ $menu_parentIds: parentIds })
  registerSuperProperties({ $menu_id_before: beforeMenuId })
  registerSuperProperties({ $menu_id_before_parentIds: beforeMenuParentIds })

  // 查到菜单id, 并且不是当前的菜单
  if (menuId && beforeMenuId !== menuId) {
    beforeMenuId = menuId
    beforeMenuParentIds = parentIds
  }

  // 没有菜单id, 清空
  if (!menuId) {
    beforeMenuId = ''
    beforeMenuParentIds = []
  }
}

/**
 * 上报信息中添加用户信息
 */
export function __loginHandle(userId?: string, reload: boolean = false) {
  if (!getMonitorInitialized())
    return
  const $store = useApp().$store
  const { instituInfo, loginInfo, departList } = $store.state.currentUserInfo
  const { access_token } = $store.state.loginInfo
  const _userId = userId || loginInfo.userId
  if (!_userId)
    return

  replaceServerUrl(_userId)

  type defaultSuperProperties = Pick<SuperProperties, '$institu_id' | '$user_id' | '$authorization' | '$departIds' | '$departNames'>
  registerSuperProperties<defaultSuperProperties>({
    $institu_id: instituInfo.instituId,
    $user_id: _userId,
    $authorization: access_token,
    $departIds: departList.map(i => i.id).join(','),
    $departNames: departList.map(i => i.name).join(','),
  })
  if (!reload) {
    monitorInstance?.login(_userId)
  }
}

/**
 * 取消用户关联
 * @description 取消用户关联, 在用户退出登录后调用
 */
export function __logOutHandle() {
  if (!getMonitorInitialized())
    return
  replaceServerUrl('')
  registerSuperProperties<SuperProperties>({
    $institu_id: '',
    $user_id: '',
    $authorization: '',
    $menu_id: '',
    $menu_parentIds: [],
    $menu_id_before: '',
    $menu_id_before_parentIds: [],
    $departIds: '',
    $departNames: '',
  })
  monitorInstance?.logout()
}

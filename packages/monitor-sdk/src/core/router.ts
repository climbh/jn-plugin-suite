import type { RouteLocationNormalized, RouteLocationNormalizedLoadedGeneric } from 'vue-router'
import useApp from '../hooks/useApp'
import { getStore } from '../utils/store'
import { addMenuInfo, loginHandle, loginOutHandle } from './private-event'

let _useId = getStore().currentUserInfo.loginInfo.userId

export default function listeningToRoute() {
  const { $store } = useApp()
  const uid = $store.state.currentUserInfo?.loginInfo?.userId
  const { $router } = useApp()
  if (uid) {
    loginHandle(uid)
  }

  $router?.beforeEach((to, from, next) => {
    associationUser(to)
    next()
  })
  $router?.beforeResolve((to) => {
    addMenuInfo(to.path)
  })
}

/**
 * 关联用户操作
 * @param to 路由信息
 */
function associationUser(to: RouteLocationNormalized) {
  const { $store } = useApp()
  const uid = $store.state.currentUserInfo?.loginInfo?.userId
  // if(!from) return
  // 退出登录清空用户关联
  if (to.path.includes('login') || !uid) {
    _useId = ''
    loginOutHandle()
    return
  }
  // 关联用户, 设置用户信息
  if (uid) {
    _useId = uid
    loginHandle(uid)
  }
}

import type { RootStateTypes } from '@jsjn/micro-core-store/interface'
import type { Store } from 'vuex'
import { getApp } from '../core/instance'

export default function useApp() {
  const { $route, $router, $store: store } = getApp().config.globalProperties
  const $store = store as Store<RootStateTypes>
  return {
    $route,
    $router,
    $store,
  }
}

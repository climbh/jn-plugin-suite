import { getMonitorInstance, reportEvent } from '../core'
import useApp from '../hooks/useApp'
import { getOrigin, queryTransform2UrlParams } from '../utils'

/**
 * 自定义页面加载性能插件保证更多的数据上报
 */

export default {
  plugin_name: 'pageview',
  init(sd: any) {
    sd.ee.sdk.on('ready', () => {
      collectPageView()
    })
  },
}

export function collectPageView() {
  const router = useApp().$router
  if (!router)
    return
  router.afterEach((to, from) => {
    if (from?.path === '' || from?.path === '/')
      return
    if (from.path !== to.path) {
      reportEvent('$pageview', {
        $referrer: `${getOrigin() + from.path}${queryTransform2UrlParams(from.query)}`,
      })

      console.log('%c [  ]-30', 'font-size:13px; background:blue; color:#fff;', getMonitorInstance()?.para?.server_url)
    }
  })
}

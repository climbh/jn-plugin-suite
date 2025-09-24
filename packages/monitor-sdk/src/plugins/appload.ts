import { reportEvent } from '../core'
import { getWindow, isLoginPage } from '../utils'

const _W = getWindow()
/**
 * 自定义页面加载性能插件保证更多的数据上报
 */

export default {
  plugin_name: 'appload',
  init(sd: any) {
    sd.ee.sdk.on('ready', () => {
      // 只有登录页才进行
      if (isLoginPage()) {
        collectPagePerformance()
      }
    })
  },
}

export function collectPagePerformance() {
  window.addEventListener('load', () => {
    const nav = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming ?? performance.timing)
    if (!nav)
      return

    // 1. 白屏时间（First Paint，近似）
    const whiteScreen = nav.responseStart - nav.startTime

    // 2. DOM 解析完成时间
    const domReady = nav.domContentLoadedEventEnd - nav.startTime

    // 3. 页面完全加载时间
    const loadTime = nav.loadEventEnd - nav.startTime

    // 4. 首字节时间（TTFB）
    const ttfb = nav.responseStart - nav.requestStart

    // 5. 资源请求耗时
    const request = nav.responseEnd - nav.requestStart

    // 6. DNS 查询耗时
    // const dns = nav.domainLookupEnd - nav.domainLookupStart

    // 7. TCP 连接耗时
    // const tcp = nav.connectEnd - nav.connectStart

    // 8. 重定向耗时
    // const redirect = nav.redirectEnd - nav.redirectStart

    // 9. 卸载页面耗时
    // const unload = nav.unloadEventEnd - nav.unloadEventStart

    // 10. DOM 解析耗时
    const domParse = nav.domComplete - nav.domInteractive

    reportEvent('$appload', {
      whiteScreen,
      domReady,
      loadTime,
      request,
      ttfb,
      // dns,
      // tcp,
      // redirect,
      // unload,
      domParse,
    })
  })
}

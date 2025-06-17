import pageleave from 'sa-sdk-javascript/dist/web/plugin/pageleave/index.es6.js'
import rgp from 'sa-sdk-javascript/dist/web/plugin/register-properties/index.es6.js'
import { setRgp } from '../core/instance'
import pageload from './pageload'

export function registerPlugin(monitorInstance: any) {
  /**
   * 页面加载时长的插件
   * event_duration 为页面的加载时长
   * $page_resource_size 页面资源大小
   * https://github.com/sensorsdata/sa-sdk-javascript/tree/master/dist/web/plugin/pageload
   */
  monitorInstance.use(pageload)

  /**
   * 页面停留时长的插件
   * event_duration 为页面的停留时长
   * https://github.com/sensorsdata/sa-sdk-javascript/tree/master/dist/web/plugin/pageleave
   */
  monitorInstance.use(pageleave, {
    custom_props: {

    },
    heartbeat_interval_time: 5,
    max_duration: 5 * 24 * 60 * 60,
    isCollectUrl(_url: string) {
    // url 为要采集页面浏览时长的页面地址。
      return true // 采集
    },
  })

  /**
   * 注册属性插件实例
   */
  const rgpInstance = monitorInstance.use(rgp)
  setRgp(rgpInstance)
}

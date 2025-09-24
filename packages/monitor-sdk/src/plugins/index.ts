// import pageleave from 'sa-sdk-javascript/dist/web/plugin/pageleave/index.es6.js'
import rgp from 'sa-sdk-javascript/dist/web/plugin/register-properties/index.es6.js'
import { setRgp } from '../core/instance'
import appload from './appload'
import pageleave from './pageleave'
import pageview from './pageview'

export function registerPlugin(
  monitorInstance: any,
  options: {
    enable_page_leave: boolean
    enable_page_view: boolean
    enable_app_load: boolean
  },
) {
  if (options.enable_page_view) {
    monitorInstance.use(pageview)
  }

  /**
   * 页面加载时长的插件
   * event_duration 为页面的加载时长
   * $page_resource_size 页面资源大小
   * https://github.com/sensorsdata/sa-sdk-javascript/tree/master/dist/web/plugin/pageload
   */
  if (options.enable_app_load) {
    monitorInstance.use(appload)
  }

  /**
   * 页面停留时长的插件
   * event_duration 为页面的停留时长
   * https://github.com/sensorsdata/sa-sdk-javascript/tree/master/dist/web/plugin/pageleave
   */
  if (options.enable_page_leave) {
    monitorInstance.use(pageleave)
  }

  /**
   * 注册属性插件实例
   */
  const rgpInstance = monitorInstance.use(rgp)
  setRgp(rgpInstance)
}

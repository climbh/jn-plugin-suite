import pageleave from 'sa-sdk-javascript/dist/web/plugin/pageleave/index.es6.js'
import rgp from 'sa-sdk-javascript/dist/web/plugin/register-properties/index.es6.js'
import pageload from './pageload'
import { setRgp } from '../core/instance'

export function registerPlugin(sensorsInstance: any) {
  /**
   * 页面加载时长的插件
   * event_duration 为页面的加载时长
   * $page_resource_size 页面资源大小
   * https://github.com/sensorsdata/sa-sdk-javascript/tree/master/dist/web/plugin/pageload
   */
  sensorsInstance.use(pageload)

  /**
   * 页面停留时长的插件
   * event_duration 为页面的停留时长
   * https://github.com/sensorsdata/sa-sdk-javascript/tree/master/dist/web/plugin/pageleave
   */
  sensorsInstance.use(pageleave, {
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
  const registerPlugin = sensorsInstance.use(rgp)
  setRgp(registerPlugin)

}

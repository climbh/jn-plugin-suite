import type { App } from 'vue'
import type { RouteConfig } from '../utils'
import type { DeepPartial } from '../utils/type'
import type { MonitorSdkConfig } from './types'
import { registerPlugin } from '../plugins'
import { isLoginPage, isUrlValid, mergeData, urlHashString } from '../utils'
import { getMonitorInstance, setApp, setMonitorInitialized, setRouterMapping } from './instance'
import { __loginHandle, addMenuInfo } from './private-event'
import listeningToRoute from './router'

const monitorInstance = getMonitorInstance()

export interface InitMonitorSdkOptions {
  config: DeepPartial<MonitorSdkConfig>
  carryingConfig: Record<string, any>
}

/**
 * 初始化神策 SDK
 * @param config 配置
 * @param carryingConfig 公共属性，会自动添加到所有事件中
 */
function initMonitorSdk(
  options?: Partial<InitMonitorSdkOptions>,
) {
  const { config, carryingConfig } = options ?? {}
  const defaultConfig: MonitorSdkConfig = {
    enable_sdk: true,
    enable_page_leave: true,
    enable_page_view: true,
    enable_app_load: true,
    enable_first_visit_profile: false,
    server_url: '', // 数据接收地址
    batch_send: {
      datasend_timeout: 10000, // 一次请求超过多少毫秒的话自动取消，防止请求无响应。
      send_interval: 10000, // 间隔多少毫秒发一次数据。
      storage_length: 200, // 存储 localStorage 条数最大值，默认：200 。如 localStorage 条数超过该值，则使用 image 方式立即发送数据。v1.24.8 以上支持。
    },
    send_type: 'ajax',
    use_base64: true,
    use_client_time: true,
    is_track_single_page: false, // 单页应用页面浏览事件采集(url改变就触发)
    use_app_track: true,
    encrypt_cookie: true,
    show_log: true, // 控制台显示数据开
    heatmap: {
      // 是否开启点击图，default 表示开启，自动采集 $WebClick 事件，可以设置 'not_collect' 表示关闭。
      // 默认只有点击 a input button textarea 四种元素时，才会触发 $WebClick 元素点击事件
      clickmap: 'default',
      // 是否开启触达图，default 表示开启，自动采集 $WebStay 事件，可以设置 'not_collect' 表示关闭。
      // 需要 Web JS SDK 版本号大于 1.9.1
      // https://manual.sensorsdata.cn/sa/docs/tech_sdk_client_web_all_use/v0300#Web_%E5%85%83%E7%B4%A0%E7%82%B9%E5%87%BB($WebClick)
      scroll_notice_map: 'not_collect',
    },
  }

  // 初始化神策 SDK
  const initConfig: MonitorSdkConfig = mergeData(config || {}, defaultConfig)

  // 神策sdk没有直接禁用sdk的配置, 所以手动设置 server_url 为空来阻止上报
  if (!initConfig.enable_sdk) {
    initConfig.server_url = ''
    setMonitorInitialized(false)
    return
  }

  if (!isUrlValid(initConfig.server_url)) {
    console.warn('当前 server_url 为空或不合法，请配置正确的 server_url！')
    setMonitorInitialized(false)
    return
  }

  setMonitorInitialized(true)

  // 注册插件
  registerPlugin(monitorInstance, {
    enable_page_leave: initConfig.enable_page_leave,
    enable_page_view: initConfig.enable_page_view,
    enable_app_load: initConfig.enable_app_load,
  })

  monitorInstance?.init(initConfig)

  // 根据配置决定是否禁用首次访问用户属性自动设置
  if (!initConfig.enable_first_visit_profile) {
    // 通过重写setOnceProfile方法来禁用自动调用
    const originalSetOnceProfile = monitorInstance?.setOnceProfile
    if (monitorInstance && originalSetOnceProfile) {
      monitorInstance.setOnceProfile = function (properties: any, callback?: any) {
        // 检查是否为SDK内部自动调用的首次访问属性
        if (properties && typeof properties === 'object') {
          const hasFirstVisitProps = Object.keys(properties).some(key =>
            key.includes('first_visit')
            || key.includes('$first_visit')
            || key === '$first_visit_time',
          )

          // 如果包含首次访问相关属性，则不执行
          if (hasFirstVisitProps) {
            console.log('已禁用首次访问用户属性自动设置')
            return this
          }
        }

        // 其他情况正常执行
        return originalSetOnceProfile.call(this, properties, callback)
      }
    }
  }
  /**
   *  初始化一般在登录页面执行(因为是在基座的main中就注册了)
   *  所以只要不是登录页, 就说明是刷新或者url进入页面, 就需要在处理登录事件
   *  (模式__loginHandle操作是在登录完成后执行的)
   *  这里再次判断是为了保证用户刷新页面数据重新初始化
   */
  if (!isLoginPage()) {
    const path = urlHashString()
    __loginHandle('', true)
    addMenuInfo(path)
  }

  // 监听路由
  listeningToRoute()

  // 神策 SDK 初始化完成，公共属性埋点(这里的属性是公共属性，会自动添加到所有事件中)
  monitorInstance?.registerPage({
    platform_type: 'Web',
    $browser: navigator.userAgent,
    ...carryingConfig,
  })

  // 自动采集事件埋点：主要用于主动触发页面浏览事件，一般只在页面配置后调用一次即可
  // if (initConfig.enable_page_view) {
  //   monitorInstance?.quick('autoTrack')
  // }
}

export function setUp(app: App, options: Partial<InitMonitorSdkOptions>, routerMapping: Record<string, RouteConfig>) {
  setRouterMapping(routerMapping)
  setApp(app)
  initMonitorSdk(options)
}

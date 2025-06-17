import type { DeepPartial, SensorsConfig } from './types'
import { registerPlugin } from '../plugins'
import { REPORT_SERVER_URL } from '../url'
import { mergeData } from '../utils'
import { getMonitorInstance } from './instance'
import listeningToRoute from './router'

const monitorInstance = getMonitorInstance()

export interface InitSensorsOptions {
  config: DeepPartial<SensorsConfig>
  carryingConfig: Record<string, any>
}

/**
 * 初始化神策 SDK
 * @param config 配置
 * @param carryingConfig 公共属性，会自动添加到所有事件中
 */
export function initSensors(
  options?: Partial<InitSensorsOptions>,
) {
  const { config, carryingConfig } = options ?? {}
  const defaultConfig: SensorsConfig = {
    server_url: REPORT_SERVER_URL, // 数据接收地址
    batch_send: {
      datasend_timeout: 10000, // 一次请求超过多少毫秒的话自动取消，防止请求无响应。
      send_interval: 10000, // 间隔多少毫秒发一次数据。
      storage_length: 200, // 存储 localStorage 条数最大值，默认：200 。如 localStorage 条数超过该值，则使用 image 方式立即发送数据。v1.24.8 以上支持。
    },
    send_type: 'ajax',
    use_client_time: true,
    is_track_single_page: true, // 单页应用页面浏览事件采集(url改变就触发)
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
      scroll_notice_map: 'default',
    },
  }

  // 注册插件
  registerPlugin(monitorInstance)

  // 监听路由
  listeningToRoute()

  // 初始化神策 SDK
  monitorInstance?.init(mergeData(config || {}, defaultConfig))

  // 神策 SDK 初始化完成，公共属性埋点(这里的属性是公共属性，会自动添加到所有事件中)
  monitorInstance?.registerPage({
    platform_type: 'Web',
    $browser: navigator.userAgent,
    ...carryingConfig,
  })

  // 自动采集事件埋点：主要用于主动触发页面浏览事件，一般只在页面配置后调用一次即可
  monitorInstance?.quick('autoTrack')
}

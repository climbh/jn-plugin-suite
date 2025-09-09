/**
 * sdk 配置
 */
export interface MonitorSdkConfig {
  /**
   * 开启监控(默认开启)
   */
  enable_sdk: boolean
  /**
   * 开启页面离开事件采集 (默认开启)
   */
  enable_page_leave: boolean

  /**
   * 开启页面浏览事件采集 (默认开启)
   */
  enable_page_view: boolean
  /**
   * 数据接收地址
   */
  server_url: string
  /**
   * 是否开启批量发送 (默认开启)
   */
  batch_send: boolean | {
    /**
     * 一次请求超过多少毫秒的话自动取消，防止请求无响应
     */
    datasend_timeout: number
    /**
     * 间隔多少毫秒发一次数据
     */
    send_interval: number
    /**
     * 存储 localStorage 条数最大值，默认：200 。如 localStorage 条数超过该值，则使用 image 方式立即发送数据
     */
    storage_length: number
  }
  /**
   * 发送类型
   */
  send_type: 'image' | 'ajax' | 'beacon'

  /**
   * 是否使用 base64 加密
   */
  use_base64: boolean

  /**
   * 是否使用客户端时间
   */
  use_client_time: boolean
  /**
   * 是否开启点击图和触达图
   */
  /**
   * 是否开启单页应用页面浏览事件采集(url改变就触发) (默认为开启)
   */
  is_track_single_page: boolean
  /**
   * 是否开启移动端应用埋点 (默认为开启)
   */
  use_app_track: boolean
  /**
   * 是否开启加密cookie (默认为开启)
   */
  encrypt_cookie: boolean
  /**
   * 是否开启控制台显示数据 (默认为开发环境打开)
   */
  show_log: boolean
  /**
   * 是否开启点击图和触达图
   */
  heatmap: {
    /**
     * 是否开启点击图 (默认为开启)
     */
    clickmap: 'default' | 'not_collect'
    /**
     * 是否开启触达图 (默认为true)
     */
    scroll_notice_map: 'default' | 'not_collect'
  }
}

/**
 * 创建自定义埋点类型上报事件的构建器
 */
export interface Tracker {
  /**
   * 添加属性
   * @param props 属性
   * @returns 构建器
   */
  addProperties: (props: Record<string, any>) => Tracker
  /**
   * 删除属性
   * @param keys 属性名
   * @returns 构建器
   */
  removeProperties: (keys: string[]) => Tracker
  /**
   * 清空属性
   * @returns 构建器
   */
  clearProperties: () => Tracker

  /**
   *  更新事件名称
   * @param eventName
   * @returns
   */
  updateEvent: (eventName: `$${string}`) => Tracker
  /**
   * 上报埋点
   * @returns 构建器
   */
  report: () => Tracker
}

/**
 * 全局属性
 */
export interface SuperProperties {
  $institu_id: string
  $user_id: string
  $authorization: string
  $departIds: string
  $departNames: string
  $menu_id: string
  $menu_parentIds: string[]
  $menu_id_before: string
  $menu_id_before_parentIds: string[]
}

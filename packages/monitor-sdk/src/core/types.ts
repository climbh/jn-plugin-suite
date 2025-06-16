export interface SensorsConfig {
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
     * 包含该列表内属性的元素会自动采集上报
     */
    track_attr?: string[]
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

// 工具类型：递归将所有属性变为可选
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    // eslint-disable-next-line ts/no-unsafe-function-type
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P]
}

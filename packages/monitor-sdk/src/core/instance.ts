import type { App } from 'vue'
import monitor from 'sa-sdk-javascript'

/**
 * 神策SDK实例
 */

export function getMonitorInstance() {
  if (window.__ENABLE_MONITOR_SDK__)
    return monitor
  return null
}

/**
 * Vue应用实例
 */
let V_APP: App

export function setApp(app: App) {
  V_APP = app
}

export function getApp() {
  return V_APP
}

export interface RGP {
  /**
   * 注册静态属性
   * @param options
   * @param options.events 需添加自定义属性的事件列表。上报日志中的 event 属性值。该值数据日志中的 type 必须为 track。 类型: Array 例如：$pageview 、$WebPageLeave 及自定义事件名称
   * @param options.properties 自定义属性，类型：Object< String | Number | Boolean | Array | Date>
   * @returns
   */
  register: (options: RgpRegisterOption) => void

  /**
   * 注册处理函数
   * @param callback
   * @param callback.event 事件名称
   * @param callback.properties 事件属性
   * @param callback.data 包含所有属性的事件对象
   * @returns
   */
  hookRegister: (callback: (eventInfo: RgpHookRegisterOption) => Record<string, object>) => void
}

export interface RgpRegisterOption {
  events: `$${string}`[]
  properties: Record<string, any>
}

export interface RgpHookRegisterOption {
  event: `$${string}`
  properties: Record<string, any>
  data: Record<string, any>
}
/**
 * 注册属性插件实例
 */
let rgp: RGP

export function setRgp(rgpInstance: RGP) {
  rgp = rgpInstance
}

export function getRgp() {
  return rgp
}

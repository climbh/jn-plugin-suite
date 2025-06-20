import type { RgpHookRegisterOption, RgpRegisterOption } from './instance'
import type { Tracker } from './types'
/**
 * 这里主要是提供事件的注册和触发功能
 */
import { getMonitorInstance, getRgp } from './instance'

const monitorInstance = getMonitorInstance()

/**
 * 注册公共属性
 * @param properties 公共属性
 * @description 添加的公共属性会自动添加到所有事件中
 */
export function registerSuperProperties(properties = {}): void {
  monitorInstance?.registerPage(properties)
}

/**
 * 添加某些事件上报的公共属性
 * @param option
 * 示例：直接设置公共属性
 * addEventRegister({
 *   events: ['$pageview'],
 *   properties: {
 *     name: '张三',
 *     age: 18,
 *   },
 * })
 *
 * 示例：通过回调函数设置公共属性
 * addEventRegister((eventInfo) => {
 *   return {
 *     name: '张三',
 *     age: 18,
 *   }
 * })
 */
// function registerEventProperties(option: RgpRegisterOption | ((eventInfo: RgpHookRegisterOption) => Record<string, any>)) {
//   const rgp = getRgp()
//   if (typeof option === 'function') {
//     rgp.hookRegister(option)
//   }
//   else {
//     rgp.register(option)
//   }
// }

/**
 * 上报自定义类型事件
 * @param eventName 事件名称（必须以$开头）
 * @param properties 上报数据
 */
export function reportEvent(eventName: `$${string}`, properties = {}): void {
  monitorInstance?.track(eventName, properties)
}
/**
 * 创建事件上报的构建器
 * @param eventName 事件名称（必须以$开头）
 * @param properties 上报数据
 * @returns 返回一个对象，支持链式调用
 */
export function createEventTracker(eventName: `$${string}`, properties: Record<string, any> = {}) {
  const tracking_uuid = crypto.randomUUID()
  let _properties: any = {
    ...properties,
    tracking_uuid,
  }
  const tracker: Tracker = {
    /**
     * 批量添加上报参数
     * @param props 参数对象
     */
    addProperties(props: Record<string, any>) {
      _properties = {
        ..._properties,
        ...props,
      }
      return tracker
    },

    removeProperties(keys: string[]) {
      keys.forEach((key) => {
        if (key === 'current_process_id') {
          return
        }
        delete _properties[key]
      })
      return tracker
    },

    clearProperties() {
      _properties = {
        tracking_uuid,
      }
      return tracker
    },

    /**
     * 执行上报
     */
    report() {
      reportEvent(eventName, _properties)
      return tracker
    },
  }
  return tracker
}

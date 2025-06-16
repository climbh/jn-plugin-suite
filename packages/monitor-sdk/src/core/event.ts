/**
 * 这里主要是提供事件的注册和触发功能
 */
import type { RgpHookRegisterOption, RgpRegisterOption } from './instance'
import { rgp, sensorsInstance } from './instance'

/**
 * 添加事件上报的公共属性
 * @param properties 公共属性
 * @description 添加的公共属性会自动添加到所有事件中
 */
export function addRegisterProperty(properties = {}): void {
  sensorsInstance.registerPage(properties)
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
export function addEventRegister(option: RgpRegisterOption | ((eventInfo: RgpHookRegisterOption) => Record<string, object>)) {
  if (typeof option === 'function') {
    rgp.hookRegister(option)
  }
  else {
    rgp.register(option)
  }
}

/**
 * 自定义埋点类型上报事件
 * @param eventName 事件名称
 * @param properties 上报数据
 */
export function addBuriedPoint(eventName: string, properties = {}): void {
  sensorsInstance.track(eventName, properties)
}

/**
 * 设置用户属性
 * @param properties 用户属性
 * @description 设置用户属性(已存在的会覆盖), 可用于补充一些数据
 */
function setProfile(properties: Record<string, any>) {
  sensorsInstance.setProfile(properties)
}

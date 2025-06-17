import type { RgpHookRegisterOption, RgpRegisterOption } from './instance'
/**
 * 这里主要是提供事件的注册和触发功能
 */
import { getMonitorInstance, getRgp } from './instance'

/**
 * 添加事件上报的公共属性
 * @param properties 公共属性
 * @description 添加的公共属性会自动添加到所有事件中
 */

const monitorInstance = getMonitorInstance()

export function addRegisterProperty(properties = {}): void {
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
export function addEventRegister(option: RgpRegisterOption | ((eventInfo: RgpHookRegisterOption) => Record<string, any>)) {
  const rgp = getRgp()
  if (typeof option === 'function') {
    rgp.hookRegister(option)
  }
  else {
    rgp.register(option)
  }
}

/**
 * 自定义埋点类型上报事件
 * @param eventName 事件名称（必须以$开头）
 * @param properties 上报数据
 */
export function addBuriedPoint(eventName: `$${string}`, properties = {}): void {
  monitorInstance?.track(eventName, properties)
}

/**
 * 创建自定义埋点类型上报事件
 * @param eventName 事件名称（必须以$开头）
 * @param properties 上报数据
 * @returns 返回一个对象，支持链式调用
 * 示例：
 * const h = createBuriedPoint('$click')
 * h.addProperties({
 *   name: '张三',
 *   age: 18,
 * }).report().clearProperties().addProperties({
 *   name: '李四',
 *   age: 20,
 * }).report()
 *
 */
export function createBuriedPoint(eventName: `$${string}`, properties: Record<string, any> = {}) {
  let _properties = properties
  const builder = {
    /**
     * 批量添加上报参数
     * @param props 参数对象
     */
    addProperties(props: Record<string, any>) {
      _properties = {
        ..._properties,
        ...props,
      }
      return builder
    },

    removeProperties(keys: string[]) {
      keys.forEach(key => delete _properties[key])
      return builder
    },

    clearProperties() {
      _properties = {}
      return builder
    },

    /**
     * 执行上报
     */
    report() {
      addBuriedPoint(eventName, _properties)
      return builder
    },
  }

  return builder
}

/**
 * 神策数据接收地址
 */
import type { App } from 'vue'
import { initSensors, type InitSensorsOptions } from './core/init'
import { setApp } from './core/instance'

export * from './core'

export default function (options?: Partial<InitSensorsOptions>) {
  return {
    install(app: App) {
      setApp(app)
      initSensors(options)
    },
  }
}

import type { App } from 'vue'
import { initSensors, type InitSensorsOptions } from './core/init'
import { setApp } from './core/instance'

export * from './core'

export default function (options?: Partial<InitSensorsOptions>) {
  return {
    install(app: App) {
      if (!window.__ENABLE_MONITOR_SDK__)
        return
      setApp(app)
      initSensors(options)
    },
  }
}

import type { App } from 'vue'
import type { MonitorSdkConfig } from './core/types'
import type { DeepPartial } from './utils/type'
import { setUp } from './core/init'

export * from './core'
export * from './core/types'

export default function (config: DeepPartial<MonitorSdkConfig>, carryingConfig: Record<string, any>) {
  return {
    install(app: App) {
      setUp(app, {
        config,
        carryingConfig,
      })
    },
  }
}

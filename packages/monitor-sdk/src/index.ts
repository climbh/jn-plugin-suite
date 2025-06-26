import type { App } from 'vue'
import type { MonitorSdkConfig } from './core/types'
import type { DeepPartial } from './utils/type'
import { setUp } from './core/init'

export * from './core'
export * from './core/types'

export default function (options: {
  routerMapping: Record<string, any>
  config?: DeepPartial<MonitorSdkConfig>
  carryingConfig?: Record<string, any>
}) {
  return {
    install(app: App) {
      const { config, carryingConfig, routerMapping } = options
      setUp(app, {
        config,
        carryingConfig,
      }, routerMapping)
    },
  }
}

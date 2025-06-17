import { getMonitorInstance } from './instance'

export * from './event'

const monitorInstance = getMonitorInstance()

export {
  monitorInstance,
}

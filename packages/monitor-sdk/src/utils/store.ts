import type { RootStateTypes } from '@jsjn/micro-core-store/interface'

export function getStore() {
  return JSON.parse(localStorage.getItem('vuex') || '{}') as RootStateTypes
}

export function setStore(key: string, value: string) {
  localStorage.setItem(key, JSON.stringify(value))
}

// 工具类型：递归将所有属性变为可选
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
  // eslint-disable-next-line ts/no-unsafe-function-type
    ? T[P] extends (...args: any[]) => any
      ? T[P]
      : DeepPartial<T[P]>
    : T[P]
}

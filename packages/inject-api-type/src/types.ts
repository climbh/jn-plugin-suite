import * as acorn from 'acorn'

export interface PluginProps {
  /**
   *  监听api文件的目录（请使用node：path获取结对路径）
   */
  watchDir: string

  /**
   * 输出文件的目录（请使用node：path获取结对路径）（默认是项目根目录）
   */
  outDir: string

  /**
   * 是否自动使用类型
   */
  autoUsageType?: boolean
}

// parse解析体
export interface Parse {
  apiName: string
  comment?: string
}

export interface Resolver {
  fileName: string
  fileResolvers: Parse[]
}



export type IComment = {
  text: string
  start: number
  end: number
  startLoc: acorn.Position | undefined
  endLoc: acorn.Position | undefined
  range: [number, number]
}
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

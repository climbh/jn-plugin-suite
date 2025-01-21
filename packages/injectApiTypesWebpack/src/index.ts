import type { Compiler } from 'webpack'
import type { PluginProps } from './types'
import { join } from 'node:path'
import { generateApi, injectApiType } from './analyze'
import { watchFiles } from './watch'

class injectApiTypesWebpack {
  private options: PluginProps = {
    watchDir: '',
    outDir: '',
  }

  private loadSuccess: boolean = false
  private rootPath: string = ''

  apply(compiler: Compiler) {
    this.rootPath = compiler.options.context!
    if (!this.rootPath)
      return

    this.options = {
      watchDir: `${this.rootPath}/src/api/modules`,
      outDir: `${this.rootPath}/src/api`,
    }

    compiler.hooks.done.tap('inject-api-types-webpack', () => {
      if (!this.loadSuccess) {
        this.run()
        this.loadSuccess = true
      }
    })
  }

  run() {
    // 默认生成api类型文件
    generateApi(this.options)
    // 注入api类型
    injectApiType(join(this.options.outDir))
    // 监听文件变化，重新生成api类型文件
    watchFiles(this.options.watchDir, () => {
      generateApi(this.options)
    })
  }
}

export default injectApiTypesWebpack

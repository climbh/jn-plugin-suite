import type { Compiler } from 'webpack'
import type { PluginProps } from './types'
import { firstLoad } from './run'

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
    firstLoad(this.options)
  }
}

export default injectApiTypesWebpack

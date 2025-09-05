import type { Compiler } from 'webpack'
import { firstLoad } from './run'
import { parseFile } from './parse'

class injectApiTypesWebpack {
  private watchDir: string = ''
  private outDir: string = ''
  private loadSuccess: boolean = false
  private rootPath: string = ''

  apply(compiler: Compiler) {
    this.rootPath = compiler.options.context!
    if (!this.rootPath)
      return

    this.watchDir = `${this.rootPath}/src/api/modules`
    this.outDir = `${this.rootPath}/src/api`
    
    compiler.hooks.done.tap('inject-api-types-webpack', () => {
      if (!this.loadSuccess) {
        this.run()
        this.loadSuccess = true
      }
    })
  }

  run() {
    // 默认生成api类型文件
    firstLoad({
      watchDir: this.watchDir,
      outDir: this.outDir,
      rootPath: this.rootPath,
    })
  }
}

export default injectApiTypesWebpack

import { Compiler } from "webpack";
import { PluginProps } from "./types";
import { generateApi, injectApiType } from "./analyze";
import { watchFiles } from "./watch";
import { join } from "node:path";


class injectApiTypesWebpack {
  private options: PluginProps
  private loadSuccess: boolean = false
  private rootPath: string = ''

  apply(compiler: Compiler) {
    this.rootPath = compiler.options.context
    this.options = {
      watchDir: this.rootPath + '/src/api/modules',
      outDir: this.rootPath + '/src/api',
    }
    // webpack hook to run the plugin
    compiler.hooks.done.tap("inject-api-types-webpack", () => {
      if (!this.loadSuccess) {
        this.run()
        this.loadSuccess = true
      }
    });
  }

  run() {
    // 默认生成api类型文件
    generateApi(this.options)
    // 注入api类型
    injectApiType(join(this.options.outDir))
    // 监听文件变化，重新生成api类型文件
    watchFiles(this.options.watchDir, (file) => {
      generateApi(this.options)
    })
  }
}

export default injectApiTypesWebpack;
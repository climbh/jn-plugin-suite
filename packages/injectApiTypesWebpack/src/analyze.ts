import type { PluginProps } from './types'
import fs from 'node:fs'
import path, { join } from 'node:path'
import { matchStr } from './utils'

export function generateApi(options: PluginProps) {
  const apis = readAllFilesInTheDir(options.watchDir)
  fs.writeFileSync(join(options.outDir, 'apiTypes.ts'), apis, 'utf-8')
}

/**
 *  获取监听的目录下的所有文件内容
 * @param dir
 * @returns
 */
export function readAllFilesInTheDir(dir: string) {
  const content: any = {}
  fs.readdirSync(dir).forEach((file) => {
    if (file.endsWith('.ts')) {
      const path = join(dir, file)
      const moduleName = file.split('.')[0]
      content[moduleName] = fs.readFileSync(path, 'utf-8')
    }
  })
  return assembly(content)
}

// 拓展的response类型
const ResponseExpand = ``
// 生成的api类型声明需要用的语句导入
const interfaceImportStr = `import type { BaseResponse } from '@jsjn/types/Response' \n interface Response extends BaseResponse { \n ${ResponseExpand} \n } \n`
function assembly(content: any) {
  let interfaceStr = `${interfaceImportStr}export interface ApiTypes {`
  Object.keys(content).forEach((moduleName) => {
    let apiNames = matchStr(content[moduleName])
    apiNames = [...new Set(apiNames.map(api => `${api}`))]
    interfaceStr += `\n${moduleName}: {\n${apiNames
      .map(apiName => `${apiName}: (params?: any) => Promise<Response>`)
      .join('\n')}\n}`
  })
  interfaceStr += '\n}'
  return interfaceStr
}

/**
 * 注入api类型
 * @param apisFilePath
 */
export function injectApiType(apisFilePath: string) {
  // 设置默认导出的类型
  const apiEntrancePath = path.join(apisFilePath, 'index.ts')
  const reg = /(apis =).*/ // 修改为只匹配一行
  const replaceStr = 'apis = Object.assign({}, coreApis, localApis) as any as ApiTypes'
  let apiEntranceContent = fs.readFileSync(apiEntrancePath, 'utf-8')
  // 将类型导入和设置接口的类型
  if (!/import \{ ApiTypes \} from/.test(apiEntranceContent)) {
    apiEntranceContent = `import { ApiTypes } from './apiTypes'\n${apiEntranceContent}`
    apiEntranceContent = apiEntranceContent.replace(reg, `${replaceStr}`)
    fs.writeFileSync(apiEntrancePath, apiEntranceContent, 'utf-8')
  }
}

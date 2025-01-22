import type { Parse, PluginProps, Resolver } from './types'
import fs from 'node:fs'
import path, { join } from 'node:path'
import { parseFile } from './parse'
import { watchFiles } from './watch'

export function firstLoad(options: PluginProps) {
  // 读取文件夹下的所有文件
  const theCompleteParser: Resolver[] = fs.readdirSync(options.watchDir).filter(i => i.endsWith('.ts')).map((file) => {
    const fileName = file.split('.')[0]
    return readParse(join(options.watchDir, file), fileName)
  })

  // 保存所有的解析体
  theCompleteParser.forEach((resolver) => {
    updateResolver(resolver)
  })

  // 生成接口
  const content = assemblyInterface()
  writeInType(content, path.join(options.outDir, 'apiTypes.ts'))

  injectApiType(options.outDir)

  // 监听文件变化
  watchFiles(options.watchDir, (file: string) => {
    const fileName = file.split('.')[0]
    const resolver = readParse(join(options.watchDir, file), fileName)
    updateResolver(resolver)
    const content = assemblyInterface()
    writeInType(content, path.join(options.outDir, 'apiTypes.ts'))
  })
}

/**
 *  读取并解析文件
 * @param filePath 文件路径
 * @returns
 */
function readParse(filePath: string, fileName: string): Resolver {
  const path = join(filePath)
  const parseFileContent = parseFile(path)
  return {
    fileName,
    fileResolvers: parseFileContent,
  }
}

const API_TYPES: {
  [key: string]: Parse[]
} = {}

function updateResolver(resolver: Resolver) {
  API_TYPES[resolver.fileName] = resolver.fileResolvers
}

// 拓展的response类型
const ResponseExpand = ``
// 生成的api类型声明需要用的语句导入
const interfaceImportStr = `import type { BaseResponse } from '@jsjn/types/Response' \n interface Response extends BaseResponse { \n ${ResponseExpand} \n } \n`
function assemblyInterface() {
  let interfaceStr = `${interfaceImportStr}export interface ApiTypes {`

  Object.keys(API_TYPES).forEach((moduleName) => {
    const apis = API_TYPES[moduleName]
    interfaceStr += `\n${moduleName}: {\n${apis
      .map(api => `/**\n*  ${api.comment}\n*/ \n${api.name}: (params?: any) => Promise<Response>`)
      .join('\n')}\n}`
  })
  // 测试测试
  interfaceStr += '\n}'

  return interfaceStr
}

/*
  * 生成文件
  */
function writeInType(Content: string, path: string) {
  fs.writeFileSync(path, Content, 'utf-8')
}

/**
 * 注入api类型
 * @param apisFilePath
 */
function injectApiType(apisFilePath: string) {
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

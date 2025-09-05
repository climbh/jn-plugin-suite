import type { Parse, Resolver } from './types'
import { exec } from 'node:child_process'
import fs from 'node:fs'
import path, { join } from 'node:path'
import { parseFile } from './parse'
import { watchFiles } from './watch'

export async function firstLoad(options: {
  watchDir: string
  outDir: string
  rootPath: string
}) {
  // 读取文件夹下的所有文件
  const theCompleteParser: Resolver[] = []
  const apiFiles = fs.readdirSync(options.watchDir).filter(i => i.endsWith('.ts')).map((file) => {
    const fileName = file.split('.')[0]
    return readParse(join(options.watchDir, file), fileName)
  })

  const res = await Promise.all(apiFiles)
  theCompleteParser.push(...res)
  // 保存所有的解析体
  theCompleteParser.forEach((resolver) => {
    updateResolver(resolver)
  })

  // 生成接口
  const content = assemblyInterface()
  writeInType(content, path.join(options.rootPath, 'api-type.d.ts'))

  injectApiType(options.outDir)

  tsConfigInject(options.rootPath)

  // 监听文件变化
  watchFiles(options.watchDir, async (file: string) => {
    const fileName = file.split('.')[0]
    const resolver = await readParse(join(options.watchDir, file), fileName)
    updateResolver(resolver)
    const content = assemblyInterface()
    writeInType(content, path.join(options.rootPath, 'api-type.d.ts'))
  })
}

/**
 *  读取并解析文件
 * @param filePath 文件路径
 * @returns
 */
async function readParse(filePath: string, fileName: string): Promise<Resolver> {
  const path = join(filePath)
  const parseFileContent = await parseFile(path)
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

/*
  * 生成文件
  */
function writeInType(Content: string, path: string) {
  fs.writeFileSync(path, Content, 'utf-8')
  exec(`npx prettier --write ${path}`)
}

// 生成的api类型声明需要用的语句导入
function assemblyInterface() {
  let interfaceStr = 
`interface BaseResponse {
    code: '000000' | '500000' | '800403' | '800405'
    data: any
    msg: string
    status: number | string
    success: boolean
} \n
declare interface IApiType {`

  Object.keys(API_TYPES).forEach((moduleName) => {
    const apis = API_TYPES[moduleName]
    interfaceStr += '\n'
    // 模块名
    interfaceStr += ` ${moduleName}:{\n`
    apis.forEach(api => {
      // 接口注释
      if(api.comment) {
        interfaceStr += ` /**\n * ${api.comment}\n  */\n`
      }
      // 接口名
      interfaceStr += `  ${api.apiName}: (params?: any) => Promise<BaseResponse>\n`
    })
    interfaceStr += `}\n`
  })
  // 测试测试
  interfaceStr += '\n}'

  return interfaceStr
}

/**
 * 注入api类型
 * @param apisFilePath
 */
function injectApiType(apisFilePath: string) {
  // 设置默认导出的类型
  const apiEntrancePath = path.join(apisFilePath, 'index.ts')
  const reg = /(apis =).*/ // 修改为只匹配一行
  const replaceStr = 'apis = Object.assign({}, coreApis, localApis) as any as IApiType'
  let apiEntranceContent = fs.readFileSync(apiEntrancePath, 'utf-8')
  // 将类型导入和设置接口的类型
  if (!apiEntranceContent.includes('IApiType')) {
    apiEntranceContent = apiEntranceContent.replace(reg, `${replaceStr}`)
    fs.writeFileSync(apiEntrancePath, apiEntranceContent, 'utf-8')
  }
}

function tsConfigInject(rootPath: string) {
  const tsConfigPath = path.join(rootPath, 'tsconfig.json')
  const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8')
  const tsConfig = JSON.parse(stripJsonComments(tsConfigContent))
  if (!tsConfig.include.join('').includes('api-type.d.ts')) {
    tsConfig.include.push('./api-type.d.ts')
  }

  fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf-8')

  // eslint 格式化
  // exec(`npx lint --fix ${tsConfigPath}`)
}

/**
 * 去掉json注释
 * @param str 
 * @returns 
 */
function stripJsonComments(str: string) {
  return str
    .replace(/\/\/.*$/gm, '');        // 去掉 // 注释
}
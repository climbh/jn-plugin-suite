import type { VariableDeclaration } from 'ts-morph'
import type { Parse } from './types'
import { ArrayLiteralExpression, ObjectLiteralExpression, Project, PropertyAssignment } from 'ts-morph'

/**
 * 解析文件
 * @param filePath 文件路径
 * @returns
 */
export function parseFile(filePath: string) {
  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(filePath)!
  if (!sourceFile)
    return []
  const result: Parse[] = []
  // 遍历所有变量声明
  sourceFile.getVariableDeclarations().forEach((declaration: VariableDeclaration) => {
    const initializer = declaration.getInitializer()

    // 检查是否是数组字面量
    if (initializer && initializer instanceof ArrayLiteralExpression) {
      initializer.getElements().forEach((element) => {
        // 检查是否是对象字面量
        if (element instanceof ObjectLiteralExpression) {
          const nameProperty = element.getProperty('name')
          const apiProperty = element.getProperty('api')

          // 提取 name 和 api 的值
          if (nameProperty && apiProperty && nameProperty instanceof PropertyAssignment && apiProperty instanceof PropertyAssignment) {
            const name = nameProperty.getInitializer()?.getText().replaceAll(/['"]/g, '') || '' // 去除引号
            const api = apiProperty.getInitializer()?.getText().replaceAll(/['"]/g, '') || '' // 去除引号
            // 提取 name 字段上方的注释
            const comment = nameProperty.getLeadingCommentRanges().map(range => range.getText().trim()).join('\n')?.replaceAll('//', '').trim()
            result.push({ name, api, comment })
          }
        }
      })
    }
  })
  return result
}

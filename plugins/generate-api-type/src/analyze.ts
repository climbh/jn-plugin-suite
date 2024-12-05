import { Project } from "ts-morph";
import { d_ts_name, interface_name } from "./contents";

const p = new Project();
/**
 *  分析*.api.ts文件
 * @param raw ts文件内容
 * @returns { name: string, apis: { name: string, api: string }[] }[]
 */
export function analyzeFile(raw: string) {
  const ps = p.createSourceFile("apis.ts", raw);
  return ps
    .getVariableDeclarations()
    .map((declaration) => {
      const name = declaration.getName(); // 获取变量名
      const initializer = declaration.getInitializer(); // 获取初始化表达式
      const type = declaration.getType().getText(); // 获取变量的类型信息
      if (!initializer) return false;
      const rawValue = initializer.getText(); // 原始代码文本
      const isArray = type.endsWith("]");
      if (!isArray) return false;
      // eslint-disable-next-line no-eval
      const apis = eval(rawValue) as {
        name: string;
        api: string;
      };
      return {
        name,
        apis,
      };
    })
    .filter((i) => i !== false);
}

/**
 *  分析接口
 * @param raw 原内容
 * @param field api文件名
 * @param apis api列表
 * @returns
 */
export function analyzeInterface(
  raw: string,
  field: string,
  apis: { name: string; api: any }[]
) {
  const ps = p.createSourceFile(d_ts_name, raw, { overwrite: true });
  // 解析apiTypes.ts文件
  const apiInterface = ps.getInterface(interface_name);
  if (!apiInterface) return "";
  // 获取改变的文件接口定义
  const property = apiInterface.getProperty(field)!;
  // 移除原有的属性
  property?.remove();
  // 重新添加属性
  apiInterface.addProperty({
    name: field,
    type: (writer) => {
      writer.writeLine("{");
      apis.forEach((api) => {
        writer.writeLine(
          `${api.name}: (params?: any) => Promise<BaseResponse>`
        );
      });
      writer.writeLine("}");
    },
  });
  return ps.getFullText()?.replace(/;/g, "") ?? "";
}

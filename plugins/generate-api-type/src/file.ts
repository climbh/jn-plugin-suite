import fs from "node:fs";
import path from "node:path";

/**
 *  获取路径下所有文件名
 * @param dir
 * @returns
 */
export function getAllFilesInThePath(dir: string) {
  const f_s = fs.readdirSync(dir).filter((file) => /.*?\.api.ts/.test(file));
  return f_s.map((file) => {
    return {
      fileName: file,
      prefix: file.replace(/^(.*)\.api.*/, "$1"),
      content: fs.readFileSync(path.join(dir, file), "utf-8"),
    };
  });
}

/**
 *  获取api类型原始内容
 * @param path
 * @returns
 */
export function getApiTypeRaw(path: string) {
  try {
    return fs.readFileSync(path, "utf-8");
  } catch (error) {
    return "";
  }
}

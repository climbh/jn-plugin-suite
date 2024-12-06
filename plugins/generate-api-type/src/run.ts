import fs from "node:fs";
import path from "node:path";
import { analyzeFile, analyzeInterface } from "./analyze";
import { d_ts_name, interface_name } from "./contents";
import { getAllFilesInThePath, getApiTypeRaw } from "./file";
import { PluginProps } from "./types";
import { watchFiles } from "./watch";

function Run(props: PluginProps) {
  const { watchDir, outDir } = props;
  let apiTypeRaw = getApiTypeRaw(outDir);
  watchFiles(watchDir, (file) => {
    const structure = [
      {
        fileName: file,
        prefix: file.replace(/^(.*)\.api.*/, "$1"),
        content: analyzeFile(
          fs.readFileSync(path.join(watchDir, file), "utf-8")
        ),
      },
    ];
    const newRaw = analyze2Structure(structure, apiTypeRaw);
    rewriteApiType(outDir, newRaw);
  });

  // 初始化
  function init() {
    // 获取所有文件内容
    const apiFileContents = getAllFilesInThePath(watchDir);

    // 解析文件内容行政结构化
    const structure = apiFileContents.map((content) => {
      return {
        fileName: content.fileName,
        prefix: content.fileName.replace(/^(.*)\.api.*/, "$1"),
        content: analyzeFile(content.content),
      };
    });

    // 是否存在api-type.d.ts文件
    if (apiTypeRaw.trim() === "") {
      const t = fs.readFileSync(
        path.join(__dirname, "api-type-template.d.ts"),
        "utf-8"
      );
      fs.writeFileSync(path.resolve(outDir, d_ts_name), t, "utf-8");
      apiTypeRaw = t;
    }

    // 重新生成api-type.d.ts文件
    const newRaw = analyze2Structure(structure, apiTypeRaw);
    rewriteApiType(outDir, newRaw);

    // 自动使用类型
    const reg = /(export const apis).*\)/
    const exportApisFile = fs.readFileSync(path.join(watchDir, 'index.ts'), 'utf-8');
    if(!(/ApiType/.test(exportApisFile))) {
      const newExportApisFile = exportApisFile.replace(reg, 'export const apis = Object.assign({}, coreApis, localApis) as any as ' + interface_name);
      fs.writeFileSync(path.join(watchDir, 'index.ts'), newExportApisFile, 'utf-8');
    }
  }
  init()
}

Run({
  watchDir: path.resolve(__dirname),
  outDir: path.join(__dirname, "../"),
});

// 解析文件内容结构化
function analyze2Structure<T extends Array<any>>(
  structures: T,
  typeRaw: string
) {
  let newTypeRaw = typeRaw;
  structures.forEach(({ prefix, content }) => {
    if (content.length > 0) {
      const raw = analyzeInterface(newTypeRaw, prefix, content as any);
      if (raw.trim() !== "") {
        newTypeRaw = raw;
      }
    }
  });
  return newTypeRaw;
}

function rewriteApiType(dir: string, raw: string) {
  fs.writeFileSync(path.join(dir, d_ts_name), raw, "utf-8");
}

export { Run };

import fs from "node:fs";
import path from "node:path";
import { analyzeFile, analyzeInterface } from "./analyze";
import { d_ts_name } from "./contents";
import { getAllFilesInThePath, getApiTypeRaw } from "./file";
import { PluginProps } from "./types";
import { watchFiles } from "./watch";

function Run(props: PluginProps) {
  const { watchDir, outDir } = props;
  let apiTypeRaw = getApiTypeRaw(outDir);
  const watcher = watchFiles(watchDir, (file) => {});

  // 获取所有文件内容
  const apiFileContents = getAllFilesInThePath(watchDir);

  // 解析文件内容行政结构化
  const structure = apiFileContents.map((content) => {
    return {
      fileName: content.fileName,
      prefix: content.fileName.replace(/^(.*)\.api.*/, "$1"),
      structure: analyzeFile(content.content),
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

  structure.forEach(({ prefix, structure }) => {
    if (structure.length > 0) {
      const raw = analyzeInterface(apiTypeRaw, prefix, structure as any);
      if (raw.trim() !== "") {
        apiTypeRaw = raw;
      }
    }
  });
  rewriteApiType(outDir, apiTypeRaw);
}

Run({
  watchDir: path.resolve(__dirname),
  outDir: path.join(__dirname, "../"),
});

function rewriteApiType(dir: string, raw: string) {
  fs.writeFileSync(path.join(dir, d_ts_name), raw, "utf-8");
}

export { Run };

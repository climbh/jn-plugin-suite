const path = require("path");

module.exports = {
  mode: "development",
  entry: "./index.ts", // 测试项目入口
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // 处理 .ts 文件
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  }
};

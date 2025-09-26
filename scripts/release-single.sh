#!/bin/bash

# 单包发布脚本
# 使用方法: ./scripts/release-single.sh <package-name> <version-type>
# 例如: ./scripts/release-single.sh monitor-sdk patch

set -e

PACKAGE_NAME=$1
VERSION_TYPE=${2:-patch}

if [ -z "$PACKAGE_NAME" ]; then
  echo "错误: 请指定包名"
  echo "使用方法: ./scripts/release-single.sh <package-name> [version-type]"
  echo "可用的包: draggable-canvas, monitor-sdk, inject-api-type, simple-uploader"
  exit 1
fi

PACKAGE_PATH="packages/$PACKAGE_NAME"

if [ ! -d "$PACKAGE_PATH" ]; then
  echo "错误: 包 $PACKAGE_NAME 不存在"
  exit 1
fi

echo "🚀 开始发布包: $PACKAGE_NAME"
echo "📦 版本类型: $VERSION_TYPE"

# 进入包目录
cd "$PACKAGE_PATH"

# 构建包
echo "🔨 构建包..."
pnpm build

# 更新版本
echo "📝 更新版本..."
npm version $VERSION_TYPE --no-git-tag-version

# 发布包
echo "🚀 发布包..."
if [ -f "package.json" ] && grep -q "publishConfig" package.json; then
  npm publish
else
  npm publish --access public
fi

echo "✅ 包 $PACKAGE_NAME 发布成功!"

# 返回根目录
cd ../..

# 提交版本更改
echo "📝 提交版本更改..."
git add "$PACKAGE_PATH/package.json"
git commit -m "chore: release $PACKAGE_NAME@$(cd $PACKAGE_PATH && node -p "require('./package.json').version")"

echo "🎉 发布完成!"
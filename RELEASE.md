# 版本管理和发布指南

本项目采用多种版本管理策略，支持统一发布和独立发布两种模式。

## 🎯 发布策略

### 方案一：Changesets 统一管理（推荐）

适用于需要统一管理版本和发布的场景。

#### 安装依赖
```bash
pnpm install
```

#### 创建变更集
```bash
# 交互式创建变更集
pnpm changeset

# 选择要发布的包
# 选择版本类型 (patch/minor/major)
# 填写变更描述
```

#### 版本更新
```bash
# 根据变更集更新版本号
pnpm version-packages
```

#### 发布包
```bash
# 发布到公共 npm
pnpm release

# 发布到私有仓库
pnpm release:ci
```

### 方案二：独立包发布

适用于包完全独立，需要单独发布的场景。

#### 使用发布脚本
```bash
# 发布单个包 (patch 版本)
./scripts/release-single.sh monitor-sdk

# 发布单个包 (指定版本类型)
./scripts/release-single.sh monitor-sdk minor
./scripts/release-single.sh draggable-canvas major
```

#### 手动发布
```bash
# 进入包目录
cd packages/monitor-sdk

# 构建
pnpm build

# 更新版本
npm version patch

# 发布
npm publish
```

## 📦 包列表

- `@jsjn/draggable-canvas` - Vue 拖拽画布组件
- `@jsjn/monitor-sdk` - 前端监控 SDK
- `@jsjn/inject-api-type` - API 类型注入插件
- `@jsjn/simple-uploader.js` - 文件上传库

## 🔧 开发脚本

```bash
# 构建所有包
pnpm build

# 并行开发模式
pnpm dev

# 代码检查
pnpm lint

# 清理构建产物
pnpm clean
```

## 📋 版本规范

遵循 [Semantic Versioning](https://semver.org/) 规范：

- **patch**: 修复 bug，向后兼容
- **minor**: 新增功能，向后兼容  
- **major**: 破坏性变更，不向后兼容

## 🚀 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      
      - run: pnpm install
      - run: pnpm build
      - run: pnpm release:ci
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📝 最佳实践

1. **提交前检查**: 确保代码通过 lint 和 test
2. **语义化版本**: 严格按照语义化版本规范
3. **变更日志**: 使用 changeset 自动生成 CHANGELOG
4. **测试发布**: 先在测试环境验证
5. **回滚准备**: 保留回滚方案

## 🔍 故障排除

### 发布失败
- 检查网络连接
- 验证 npm 认证信息
- 确认包名是否已存在

### 版本冲突
- 手动解决 package.json 冲突
- 重新运行版本更新命令

### 权限问题
- 确认 npm 账户权限
- 检查 publishConfig 配置
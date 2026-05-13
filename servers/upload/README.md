# upload-server

用于本地附件上传测试的独立服务，默认端口 `8890`。

## 启动

```bash
pnpm --filter upload-server dev
```

## 接口

### 直接上传

- `POST /upload`
- 随机等待 `3-5` 秒后返回
- 支持 `multipart/form-data` 的 `file` 字段，也支持 `application/octet-stream`

```bash
curl -F "file=@/path/to/demo.txt" http://localhost:8890/upload
```

### 分片上传

- `POST /upload/chunk`
- 随机等待 `1-2` 秒后返回
- 必传字段：`file`、`filename`、`identifier`、`chunkNumber`、`totalChunks`
- `chunkNumber` 从 `1` 开始；所有分片到齐后自动合并

```bash
curl -F "file=@/path/to/chunk-1" \
  -F "filename=demo.txt" \
  -F "identifier=demo-001" \
  -F "chunkNumber=1" \
  -F "totalChunks=3" \
  http://localhost:8890/upload/chunk
```

上传文件保存在 `servers/upload/uploads`。

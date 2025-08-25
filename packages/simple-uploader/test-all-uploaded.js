// 测试当 checkChunkUploadedByResponse 全部返回 true 时的 fileSuccess 回调
const Uploader = require('./src/uploader')

// 创建测试用的模拟 blob
function createMockBlob(content) {
  return new Blob([content], { type: 'text/plain' })
}

console.log('=== 测试 checkChunkUploadedByResponse 全部返回 true 的情况 ===')

const uploader = new Uploader({
  target: '/upload',
  chunkSize: 10, // 很小的分片大小，确保多个分片
  testChunks: false, // 不使用 testChunks
  
  checkChunkUploadedByResponse: function(chunk, message) {
    console.log(`检查分片 ${chunk.offset + 1}/${chunk.file.chunks.length}`)
    // 模拟所有分片都已上传
    return true
  }
})

// 监听事件
uploader.on('fileAdded', (file) => {
  console.log('✅ 文件已添加:', file.name, '大小:', file.size, '分片数:', file.chunks.length)
})

uploader.on('fileProgress', (rootFile, file, chunk) => {
  console.log('📊 文件上传进度:', file.name, Math.floor(file.progress() * 100) + '%')
})

uploader.on('fileSuccess', (rootFile, file, message, chunk) => {
  console.log('🎉 文件上传成功:', file.name)
})

uploader.on('fileComplete', (rootFile, file) => {
  console.log('✅ 文件完成:', file.name)
})

uploader.on('complete', () => {
  console.log('🏁 所有文件上传完成')
})

// 创建测试文件
const testContent = 'Hello, this is a test file content that should be split into multiple chunks.'
const mockFile = createMockBlob(testContent)
mockFile.name = 'test.txt'
mockFile.size = testContent.length
mockFile.lastModified = Date.now()

console.log('开始测试...')
console.log('文件内容长度:', testContent.length)
console.log('分片大小:', uploader.opts.chunkSize)
console.log('预期分片数:', Math.ceil(testContent.length / uploader.opts.chunkSize))

// 添加文件并开始上传
uploader.addFiles([mockFile])
uploader.upload()

// 等待一段时间查看结果
setTimeout(() => {
  console.log('\n=== 最终状态 ===')
  uploader.files.forEach((file, index) => {
    console.log(`文件 ${index + 1}:`)
    console.log('  名称:', file.name)
    console.log('  进度:', Math.floor(file.progress() * 100) + '%')
    console.log('  是否完成:', file.isComplete())
    console.log('  是否有错误:', file.error)
    console.log('  分片状态:')
    file.chunks.forEach((chunk, chunkIndex) => {
      console.log(`    分片 ${chunkIndex + 1}: ${chunk.status()}, tested: ${chunk.tested}`)
    })
  })
}, 2000)

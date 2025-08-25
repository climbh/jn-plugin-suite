// 示例：如何使用 skipTestChunksRequest 选项
// 在调用 test 方法时不进行接口请求，但仍然触发 checkChunkUploadedByResponse

const Uploader = require('./src/uploader')

// 创建上传器实例
const uploader = new Uploader({
  target: '/upload',
  testChunks: true, // 启用分片测试
  skipTestChunksRequest: true, // 跳过测试请求，但仍触发 checkChunkUploadedByResponse
  
  // 自定义检查分片是否已上传的函数
  checkChunkUploadedByResponse: function(chunk, message) {
    console.log('检查分片状态:', {
      chunkNumber: chunk.offset + 1,
      fileName: chunk.file.name,
      identifier: chunk.file.uniqueIdentifier
    })
    
    // 这里可以实现你的业务逻辑
    // 例如：从本地存储、缓存或其他方式检查分片状态
    
    // 示例：假设我们有一个本地缓存来记录已上传的分片
    const uploadedChunks = getUploadedChunksFromCache(chunk.file.uniqueIdentifier)
    const chunkNumber = chunk.offset + 1
    
    if (uploadedChunks && uploadedChunks.includes(chunkNumber)) {
      console.log(`分片 ${chunkNumber} 已存在，跳过上传`)
      return true // 返回 true 表示分片已上传
    } else {
      console.log(`分片 ${chunkNumber} 需要上传`)
      return false // 返回 false 表示分片需要上传
    }
  }
})

// 模拟的缓存函数
function getUploadedChunksFromCache(fileIdentifier) {
  // 这里可以从 localStorage、IndexedDB 或其他存储中获取已上传的分片信息
  // 示例：返回已上传的分片编号数组
  const cache = {
    'file-123': [1, 2, 3], // 假设文件 file-123 的前3个分片已上传
    'file-456': [1, 5, 8]  // 假设文件 file-456 的第1、5、8个分片已上传
  }
  return cache[fileIdentifier] || []
}

// 监听文件添加事件
uploader.on('fileAdded', function(file) {
  console.log('文件已添加:', file.name)
})

// 监听分片测试事件
uploader.on('chunkingStart', function(file) {
  console.log('开始分片测试:', file.name)
})

// 监听上传进度
uploader.on('fileProgress', function(file) {
  console.log(`上传进度: ${file.name} - ${Math.round(file.progress() * 100)}%`)
})

// 监听上传完成
uploader.on('fileSuccess', function(file, message) {
  console.log('文件上传成功:', file.name)
})

// 使用示例
console.log('\n=== skipTestChunksRequest 功能说明 ===')
console.log('1. 设置 testChunks: true 启用分片测试')
console.log('2. 设置 skipTestChunksRequest: true 跳过实际的网络请求')
console.log('3. 实现 checkChunkUploadedByResponse 函数来检查分片状态')
console.log('4. 在 test 方法中会直接调用 checkChunkUploadedByResponse 而不发送请求')
console.log('5. 根据返回值决定是否跳过该分片的上传\n')

// 导出配置供其他地方使用
module.exports = {
  uploader,
  getUploadedChunksFromCache
}
// 测试 processParams 同步和异步功能
const Uploader = require('./src/uploader')

// 创建测试用的模拟文件
const mockFile = {
  name: 'test.txt',
  size: 1024,
  type: 'text/plain',
  lastModified: Date.now()
}

// 测试1：同步 processParams
console.log('=== 测试同步 processParams ===')
const syncUploader = new Uploader({
  target: '/upload',
  processParams(params) {
    console.log('同步处理前:', params)
    params.syncFlag = true
    params.timestamp = Date.now()
    console.log('同步处理后:', params)
    return params
  }
})

// 测试2：异步 processParams (async/await)
console.log('\n=== 测试异步 processParams (async/await) ===')
const asyncUploader = new Uploader({
  target: '/upload',
  async processParams(params) {
    console.log('异步处理前:', params)
    
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100))
    
    params.asyncFlag = true
    params.token = 'async-token-' + Date.now()
    console.log('异步处理后:', params)
    return params
  }
})

// 测试3：返回 Promise 的 processParams
console.log('\n=== 测试返回 Promise 的 processParams ===')
const promiseUploader = new Uploader({
  target: '/upload',
  processParams(params) {
    console.log('Promise处理前:', params)
    return new Promise(resolve => {
      setTimeout(() => {
        params.promiseFlag = true
        params.delayed = true
        console.log('Promise处理后:', params)
        resolve(params)
      }, 150)
    })
  }
})

// 模拟测试函数
async function testProcessParams() {
  console.log('开始测试...')
  
  // 创建模拟的 chunk 和相关对象
  const mockChunk = {
    uploader: syncUploader,
    file: { file: mockFile, uniqueIdentifier: 'test-
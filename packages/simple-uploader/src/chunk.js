let utils = require('./utils')

function Chunk(uploader, file, offset) {
  utils.defineNonEnumerable(this, 'uploader', uploader)
  utils.defineNonEnumerable(this, 'file', file)
  utils.defineNonEnumerable(this, 'bytes', null)
  this.offset = offset
  this.tested = false
  this.retries = 0
  this.pendingRetry = false
  this.preprocessState = 0
  this.readState = 0
  this.loaded = 0
  this.total = 0
  this.chunkSize = utils.evalOpts(uploader.opts.chunkSize, file, this)
  this.startByte = this.offset * this.chunkSize
  this.endByte = this.computeEndByte()
  this.xhr = null
}

let STATUS = Chunk.STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  READING: 'reading',
  SUCCESS: 'success',
  ERROR: 'error',
  COMPLETE: 'complete',
  PROGRESS: 'progress',
  RETRY: 'retry',
}

utils.extend(Chunk.prototype, {
  _event(evt, args) {
    args = utils.toArray(arguments)
    args.unshift(this)
    this.file._chunkEvent.apply(this.file, args)
  },

  computeEndByte() {
    let endByte = Math.min(this.file.size, (this.offset + 1) * this.chunkSize)
    if (this.file.size - endByte < this.chunkSize && !this.uploader.opts.forceChunkSize) {
      // The last chunk will be bigger than the chunk size,
      // but less than 2 * this.chunkSize
      endByte = this.file.size
    }
    return endByte
  },

  getParams() {
    return {
      chunkNumber: this.offset + 1,
      chunkSize: this.chunkSize,
      currentChunkSize: this.endByte - this.startByte,
      totalSize: this.file.size,
      identifier: this.file.uniqueIdentifier,
      filename: this.file.name,
      relativePath: this.file.relativePath,
      totalChunks: this.file.chunks.length,
    }
  },

  getTarget(target, params) {
    if (params.length === 0) {
      return target
    }
    if (target.indexOf('?') === -1) {
      target += '?'
    }
    else {
      target += '&'
    }
    return target + params.join('&')
  },

  async test() {
    let $ = this
    function testHandler() {
      let status = $.status(true)
      if (status === STATUS.ERROR) {
        
        $._event(status, $.message())
        $.uploader.uploadNextChunk()
      }
      else if (status === STATUS.SUCCESS) {
        $._event(status, $.message())
        $.tested = true
      }
      else if (!$.file.paused) {
        // Error might be caused by file pause method
        // Chunks does not exist on the server side
        $.tested = true
        $.send()
      }
    }

    this.xhr = new XMLHttpRequest()
    this.xhr.addEventListener('load', testHandler, false)
    this.xhr.addEventListener('error', testHandler, false)
    let testMethod = utils.evalOpts(this.uploader.opts.testMethod, this.file, this)
    let data = await this.prepareXhrRequest(testMethod, true)
    this.xhr.send(data)
  },

  preprocessFinished() {
    // Compute the endByte after the preprocess function to allow an
    // implementer of preprocess to set the fileObj size
    this.endByte = this.computeEndByte()
    this.preprocessState = 2
    this.send()
  },

  readFinished(bytes) {
    this.readState = 2
    this.bytes = bytes
    this.send()
  },

  // 在chunk.js的send方法中添加checkChunkUploaded检查 (约第110行)
  async send() {
    let preprocess = this.uploader.opts.preprocess
    let read = this.uploader.opts.readFileFn
    if (typeof preprocess === 'function') {
      switch (this.preprocessState) {
        case 0:
          this.preprocessState = 1
          preprocess(this)
          return
        case 1:
          return
      }
    }
    switch (this.readState) {
      case 0:
        this.readState = 1
        read(this.file, this.file.fileType, this.startByte, this.endByte, this)
        return
      case 1:
        return
    }
    
    // 新增：当testChunks为false时，检查checkChunkUploaded回调
    if (!this.uploader.opts.testChunks && this.uploader.opts.checkChunkUploaded && !this.tested) {
      var shouldSkip = this.uploader.opts.checkChunkUploaded.call(this.uploader, this)
      if (shouldSkip) {
        // 跳过这个分片，直接标记为成功
        this._markAsSkipped()
        return
      }
    }
    
    if (this.uploader.opts.testChunks && !this.tested) {
      this.test()
      return
    }


    this.loaded = 0
    this.total = 0
    this.pendingRetry = false

    // 设置请求并监听事件
    this.xhr = new XMLHttpRequest()
    this.xhr.upload.addEventListener('progress', progressHandler, false)
    this.xhr.addEventListener('load', doneHandler, false)
    this.xhr.addEventListener('error', doneHandler, false)

    let uploadMethod = utils.evalOpts(this.uploader.opts.uploadMethod, this.file, this)
    let data = await this.prepareXhrRequest(uploadMethod, false, this.uploader.opts.method, this.bytes)
    this.xhr.send(data)

    let $ = this
    function progressHandler(event) {
      if (event.lengthComputable) {
        $.loaded = event.loaded
        $.total = event.total
      }
      $._event(STATUS.PROGRESS, event)
    }

    function doneHandler() {
      let msg = $.message()
      $.processingResponse = true
      $.uploader.opts.processResponse(msg, (err, res) => {
        $.processingResponse = false
        if (!$.xhr) {
          return
        }
        $.processedState = {
          err,
          res,
        }
        let status = $.status()
        if (status === STATUS.SUCCESS || status === STATUS.ERROR) {
          // delete this.data
          $._event(status, res)
          status === STATUS.ERROR && $.uploader.uploadNextChunk()
        }
        else {
          $._event(STATUS.RETRY, res)
          $.pendingRetry = true
          $.abort()
          $.retries++
          let retryInterval = $.uploader.opts.chunkRetryInterval
          if (retryInterval) {
            setTimeout(() => {
              $.send()
            }, retryInterval)
          }
          else {
            $.send()
          }
        }
      }, $.file, $)
    }
  },

  // 添加_markAsSkipped方法
  _markAsSkipped() {
    // 创建一个模拟的xhr对象表示成功状态
    this.xhr = {
      status: 200,
      responseText: JSON.stringify({skipped: true, success: true}),
      readyState: 4
    }
    
    this.tested = true
    this.loaded = this.endByte - this.startByte // 设置为分片完整大小
    this.total = this.endByte - this.startByte
    this.processingResponse = true // 先设置为处理中
    
    var self = this
    var response = JSON.stringify({skipped: true, success: true})
    
    // 使用setTimeout模拟异步网络响应
    setTimeout(function() {
      // 模拟完整的doneHandler流程
      self.processingResponse = true
      self.uploader.opts.processResponse(response, function(err, res) {
        self.processingResponse = false
        if (!self.xhr) {
          return
        }
        self.processedState = {
          err: err,
          res: res || response
        }
        
        var status = self.status()
        if (status === STATUS.SUCCESS || status === STATUS.ERROR) {
          // 触发事件，这会调用file._chunkEvent
          self._event(status, res || response)
          if (status === STATUS.ERROR) {
            self.uploader.uploadNextChunk()
          }
        } else {
          self._event(STATUS.RETRY, res || response)
          self.pendingRetry = true
          self.abort()
          self.retries++
          var retryInterval = self.uploader.opts.chunkRetryInterval
          if (retryInterval) {
            setTimeout(function() {
              self.send()
            }, retryInterval)
          } else {
            self.send()
          }
        }
      }, self.file, self)
    }, 0)
  },

  abort() {
    let xhr = this.xhr
    this.xhr = null
    this.processingResponse = false
    this.processedState = null
    if (xhr) {
      xhr.abort()
    }
  },

  // 修改status方法以正确处理跳过的分片
  status(isTest) {
    if (this.readState === 1) {
      return STATUS.READING
    }
    else if (this.pendingRetry || this.preprocessState === 1) {
      // 如果等待重试，那实际上等同于正在上传
      // 可能只是在重试开始前有轻微延迟
      return STATUS.UPLOADING
    }
    else if (!this.xhr) {
      return STATUS.PENDING
    }
    else if (this.xhr.readyState < 4 || this.processingResponse) {
      // 状态实际上是 'OPENED', 'HEADERS_RECEIVED'
      // 或 'LOADING' - 意味着正在处理中
      return STATUS.UPLOADING
    }
      let _status
      if (this.uploader.opts.successStatuses.includes(this.xhr.status)) {
        // HTTP 200, 完美
        // HTTP 202 已接受 - 请求已被接受处理，但处理尚未完成
        _status = STATUS.SUCCESS
      }
      else if (this.uploader.opts.permanentErrors.includes(this.xhr.status)
        || !isTest && this.retries >= this.uploader.opts.maxChunkRetries) {
        // HTTP 415/500/501, 永久错误
        _status = STATUS.ERROR
      }
      else {
        // 这种情况不应该发生，但我们会重置并排队重试
        // 可能的情况是503服务不可用
        this.abort()
        _status = STATUS.PENDING
      }
      let processedState = this.processedState
      if (processedState && processedState.err) {
        _status = STATUS.ERROR
      }
      return _status
  },

  // 修改progress方法以正确处理跳过的分片
  progress() {
    if (this.pendingRetry) {
      return 0
    }
    let s = this.status()
    if (s === STATUS.SUCCESS || s === STATUS.ERROR) {
      return 1
    }
    else if (s === STATUS.PENDING) {
      return 0
    }
      return this.total > 0 ? this.loaded / this.total : 0
  },

  // 修改sizeUploaded方法以正确处理跳过的分片
  sizeUploaded() {
    let size = this.endByte - this.startByte
    // 不能只返回chunk.loaded值，因为它可能比chunk大小还大
    if (this.status() !== STATUS.SUCCESS) {
      size = this.progress() * size
    }
    return size
  },

  message() {
    return this.xhr ? this.xhr.responseText : ''
  },
  async prepareXhrRequest(method, isTest, paramsMethod, blob) {
    // Add data from the query options
    let query = utils.evalOpts(this.uploader.opts.query, this.file, this, isTest)
    query = utils.extend(this.getParams(), query)

    // processParams
    query = await Promise.resolve(this.uploader.opts.processParams(query, this.file, this, isTest))

    let target = utils.evalOpts(this.uploader.opts.target, this.file, this, isTest)
    let data = null
    if (method === 'GET' || paramsMethod === 'octet') {
      // Add data from the query options
      let params = []
      utils.each(query, (v, k) => {
        params.push([encodeURIComponent(k), encodeURIComponent(v)].join('='))
      })
      target = this.getTarget(target, params)
      data = blob || null
    }
    else {
      // Add data from the query options
      data = new FormData()
      utils.each(query, (v, k) => {
        data.append(k, v)
      })
      if (blob) {
        data.append(this.uploader.opts.fileParameterName, blob, this.file.name)
      }
    }

    this.xhr.open(method, target, true)
    this.xhr.withCredentials = this.uploader.opts.withCredentials

    // Add data from header options
    utils.each(utils.evalOpts(this.uploader.opts.headers, this.file, this, isTest), function (v, k) {
      this.xhr.setRequestHeader(k, v)
    }, this)

    return data
  },

})

module.exports = Chunk

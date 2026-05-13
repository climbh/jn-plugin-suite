import utils from './utils.js'

class Chunk {
  static STATUS = {
    PENDING: 'pending',
    UPLOADING: 'uploading',
    READING: 'reading',
    SUCCESS: 'success',
    ERROR: 'error',
    COMPLETE: 'complete',
    PROGRESS: 'progress',
    RETRY: 'retry',
  }

  constructor(uploader, file, offset) {
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

  _event(evt, ...args) {
    this.file._chunkEvent(this, evt, ...args)
  }

  computeEndByte() {
    let endByte = Math.min(this.file.size, (this.offset + 1) * this.chunkSize)
    if (this.file.size - endByte < this.chunkSize && !this.uploader.opts.forceChunkSize) {
      endByte = this.file.size
    }
    return endByte
  }

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
  }

  getTarget(target, params) {
    if (params.length === 0) {
      return target
    }

    return `${target}${target.includes('?') ? '&' : '?'}${params.join('&')}`
  }

  async test() {
    const testHandler = () => {
      const status = this.status(true)
      if (status === Chunk.STATUS.ERROR) {
        this._event(status, this.message())
        this.uploader.uploadNextChunk()
        return
      }

      if (status === Chunk.STATUS.SUCCESS) {
        this._event(status, this.message())
        this.tested = true
        return
      }

      if (!this.file.paused) {
        this.tested = true
        this.send()
      }
    }

    this.xhr = new XMLHttpRequest()
    this.xhr.addEventListener('load', testHandler, false)
    this.xhr.addEventListener('error', testHandler, false)

    const testMethod = utils.evalOpts(this.uploader.opts.testMethod, this.file, this)
    const data = await this.prepareXhrRequest(testMethod, true)
    this.xhr.send(data)
  }

  preprocessFinished() {
    this.endByte = this.computeEndByte()
    this.preprocessState = 2
    this.send()
  }

  readFinished(bytes) {
    this.readState = 2
    this.bytes = bytes
    this.send()
  }

  async send() {
    const { preprocess, readFileFn: read } = this.uploader.opts

    if (typeof preprocess === 'function') {
      if (this.preprocessState === 0) {
        this.preprocessState = 1
        preprocess(this)
        return
      }
      if (this.preprocessState === 1) {
        return
      }
    }

    if (this.readState === 0) {
      this.readState = 1
      read(this.file, this.file.fileType, this.startByte, this.endByte, this)
      return
    }
    if (this.readState === 1) {
      return
    }

    if (!this.uploader.opts.testChunks && this.uploader.opts.checkChunkUploaded && !this.tested) {
      const shouldSkip = this.uploader.opts.checkChunkUploaded.call(this.uploader, this)
      if (shouldSkip) {
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

    const progressHandler = (event) => {
      if (event.lengthComputable) {
        this.loaded = event.loaded
        this.total = event.total
      }
      this._event(Chunk.STATUS.PROGRESS, event)
    }

    const doneHandler = () => {
      const message = this.message()
      this.processingResponse = true

      this.uploader.opts.processResponse(message, (err, res) => {
        this.processingResponse = false
        if (!this.xhr) {
          return
        }

        this.processedState = { err, res }
        const status = this.status()

        if (status === Chunk.STATUS.SUCCESS || status === Chunk.STATUS.ERROR) {
          this._event(status, res)
          if (status === Chunk.STATUS.ERROR) {
            this.uploader.uploadNextChunk()
          }
          return
        }

        this._event(Chunk.STATUS.RETRY, res)
        this.pendingRetry = true
        this.abort()
        this.retries += 1

        const retryInterval = this.uploader.opts.chunkRetryInterval
        if (retryInterval) {
          setTimeout(() => {
            this.send()
          }, retryInterval)
          return
        }

        this.send()
      }, this.file, this)
    }

    this.xhr = new XMLHttpRequest()
    this.xhr.upload.addEventListener('progress', progressHandler, false)
    this.xhr.addEventListener('load', doneHandler, false)
    this.xhr.addEventListener('error', doneHandler, false)

    const uploadMethod = utils.evalOpts(this.uploader.opts.uploadMethod, this.file, this)
    const data = await this.prepareXhrRequest(uploadMethod, false, this.uploader.opts.method, this.bytes)
    this.xhr.send(data)
  }

  _markAsSkipped() {
    const response = JSON.stringify({ skipped: true, success: true })

    this.xhr = {
      status: 200,
      responseText: response,
      readyState: 4,
    }

    this.tested = true
    this.loaded = this.endByte - this.startByte
    this.total = this.endByte - this.startByte
    this.processingResponse = true

    setTimeout(() => {
      this.processingResponse = true
      this.uploader.opts.processResponse(response, (err, res) => {
        this.processingResponse = false
        if (!this.xhr) {
          return
        }

        this.processedState = {
          err,
          res: res || response,
        }

        const status = this.status()
        if (status === Chunk.STATUS.SUCCESS || status === Chunk.STATUS.ERROR) {
          this._event(status, res || response)
          if (status === Chunk.STATUS.ERROR) {
            this.uploader.uploadNextChunk()
          }
          return
        }

        this._event(Chunk.STATUS.RETRY, res || response)
        this.pendingRetry = true
        this.abort()
        this.retries += 1

        const retryInterval = this.uploader.opts.chunkRetryInterval
        if (retryInterval) {
          setTimeout(() => {
            this.send()
          }, retryInterval)
          return
        }

        this.send()
      }, this.file, this)
    }, 0)
  }

  abort() {
    const { xhr } = this
    this.xhr = null
    this.processingResponse = false
    this.processedState = null

    if (xhr) {
      xhr.abort()
    }
  }

  status(isTest) {
    if (this.readState === 1) {
      return Chunk.STATUS.READING
    }
    if (this.pendingRetry || this.preprocessState === 1) {
      return Chunk.STATUS.UPLOADING
    }
    if (!this.xhr) {
      return Chunk.STATUS.PENDING
    }
    if (this.xhr.readyState < 4 || this.processingResponse) {
      return Chunk.STATUS.UPLOADING
    }

    let status
    if (this.uploader.opts.successStatuses.includes(this.xhr.status)) {
      status = Chunk.STATUS.SUCCESS
    } else if (
      this.uploader.opts.permanentErrors.includes(this.xhr.status)
      || (!isTest && this.retries >= this.uploader.opts.maxChunkRetries)
    ) {
      status = Chunk.STATUS.ERROR
    } else {
      this.abort()
      status = Chunk.STATUS.PENDING
    }

    if (this.processedState?.err) {
      status = Chunk.STATUS.ERROR
    }

    return status
  }

  progress() {
    if (this.pendingRetry) {
      return 0
    }

    const status = this.status()
    if (status === Chunk.STATUS.SUCCESS || status === Chunk.STATUS.ERROR) {
      return 1
    }
    if (status === Chunk.STATUS.PENDING) {
      return 0
    }

    return this.total > 0 ? this.loaded / this.total : 0
  }

  sizeUploaded() {
    const chunkSize = this.endByte - this.startByte
    if (this.status() !== Chunk.STATUS.SUCCESS) {
      return this.progress() * chunkSize
    }
    return chunkSize
  }

  message() {
    return this.xhr ? this.xhr.responseText : ''
  }

  async prepareXhrRequest(method, isTest, paramsMethod, blob) {
    let query = utils.evalOpts(this.uploader.opts.query, this.file, this, isTest)
    query = utils.extend(this.getParams(), query)
    query = await Promise.resolve(this.uploader.opts.processParams(query, this.file, this, isTest))

    let target = utils.evalOpts(this.uploader.opts.target, this.file, this, isTest)
    let data = null

    if (method === 'GET' || paramsMethod === 'octet') {
      const params = []
      utils.each(query, (value, key) => {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      })
      target = this.getTarget(target, params)
      data = blob || null
    } else {
      data = new FormData()
      utils.each(query, (value, key) => {
        data.append(key, value)
      })
      if (blob) {
        data.append(this.uploader.opts.fileParameterName, blob, this.file.name)
      }
    }

    this.xhr.open(method, target, true)
    this.xhr.withCredentials = this.uploader.opts.withCredentials

    utils.each(utils.evalOpts(this.uploader.opts.headers, this.file, this, isTest), (value, key) => {
      this.xhr.setRequestHeader(key, value)
    })

    return data
  }
}

export default Chunk

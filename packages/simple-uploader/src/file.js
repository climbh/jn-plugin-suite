import utils from './utils.js'
import Chunk from './chunk.js'

class File {
  constructor(uploader, file, parent, { isRoot = false } = {}) {
    utils.defineNonEnumerable(this, 'uploader', uploader || this)
    this.isRoot = isRoot
    this.isFolder = isRoot || uploader === this

    utils.defineNonEnumerable(this, 'parent', parent || null)
    utils.defineNonEnumerable(this, 'files', [])
    utils.defineNonEnumerable(this, 'fileList', [])
    utils.defineNonEnumerable(this, 'chunks', [])
    utils.defineNonEnumerable(this, '_errorFiles', [])
    utils.defineNonEnumerable(this, 'file', null)

    this.id = utils.uid()

    if (this.isRoot || !file) {
      this.file = null
    } else if (utils.isString(file)) {
      this.isFolder = true
      this.file = null
      this.path = file

      let currentPath = file
      if (this.parent?.path) {
        currentPath = file.slice(this.parent.path.length)
      }

      this.name = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath
    } else {
      this.file = file
      this.fileType = this.file.type
      this.name = file.fileName || file.name
      this.size = file.size
      this.relativePath = file.relativePath || file.webkitRelativePath || this.name
      this._parseFile()
    }

    this.paused = this.uploader?.opts?.initialPaused || false
    this.error = false
    this.allError = false
    this.aborted = false
    this.completed = false
    this.averageSpeed = 0
    this.currentSpeed = 0
    this._lastProgressCallback = Date.now()
    this._prevUploadedSize = 0
    this._prevProgress = 0

    this.bootstrap()
  }

  _parseFile() {
    const parentPaths = parsePaths(this.relativePath)
    if (parentPaths.length === 0) {
      this._updateParentFileList()
      return
    }

    const { filePaths } = this.uploader
    utils.each(parentPaths, (path, index) => {
      let folderFile = filePaths[path]
      if (!folderFile) {
        folderFile = new File(this.uploader, path, this.parent)
        filePaths[path] = folderFile
        this._updateParentFileList(folderFile)
      }

      this.parent = folderFile
      folderFile.files.push(this)

      if (!parentPaths[index + 1]) {
        folderFile.fileList.push(this)
      }
    }, this)
  }

  _updateParentFileList(file = this) {
    const { parent } = this
    if (parent) {
      parent.fileList.push(file)
    }
  }

  _eachAccess(eachFn, fileFn) {
    if (this.isFolder) {
      utils.each(this.files, (file, index) => eachFn.call(this, file, index), this)
      return
    }

    fileFn.call(this, this)
  }

  bootstrap() {
    if (this.isFolder) {
      return
    }

    const { opts } = this.uploader
    if (utils.isFunction(opts.initFileFn)) {
      opts.initFileFn.call(this, this)
    }

    this.abort(true)
    this._resetError()
    this._prevProgress = 0
    this._firstResponse = false

    const round = opts.forceChunkSize ? Math.ceil : Math.floor
    const chunkCount = Math.max(round(this.size / opts.chunkSize), 1)
    for (let offset = 0; offset < chunkCount; offset += 1) {
      this.chunks.push(new Chunk(this.uploader, this, offset))
    }
  }

  _measureSpeed() {
    const smoothingFactor = this.uploader.opts.speedSmoothingFactor
    const timeSpan = Date.now() - this._lastProgressCallback
    if (!timeSpan) {
      return
    }

    const uploaded = this.sizeUploaded()
    this.currentSpeed = Math.max(((uploaded - this._prevUploadedSize) / timeSpan) * 1000, 0)
    this.averageSpeed = smoothingFactor * this.currentSpeed + (1 - smoothingFactor) * this.averageSpeed
    this._prevUploadedSize = uploaded

    if (this.parent && this.parent._checkProgress()) {
      this.parent._measureSpeed()
    }
  }

  _checkProgress() {
    return Date.now() - this._lastProgressCallback >= this.uploader.opts.progressCallbacksInterval
  }

  _chunkEvent(chunk, evt, message) {
    const { uploader } = this
    const { STATUS } = Chunk
    const rootFile = this.getRoot()
    const triggerProgress = () => {
      this._measureSpeed()
      uploader._trigger('fileProgress', rootFile, this, chunk)
      this._lastProgressCallback = Date.now()
    }

    switch (evt) {
      case STATUS.PROGRESS:
        if (this._checkProgress()) {
          triggerProgress()
        }
        break
      case STATUS.ERROR:
        this._error()
        this.abort(true)
        uploader._trigger('fileError', rootFile, this, message, chunk)
        break
      case STATUS.SUCCESS: {
        this._updateUploadedChunks(message, chunk)
        if (this.error) {
          return
        }

        clearTimeout(this._progeressId)
        this._progeressId = 0

        const timeDiff = Date.now() - this._lastProgressCallback
        if (timeDiff < uploader.opts.progressCallbacksInterval) {
          this._progeressId = setTimeout(triggerProgress, uploader.opts.progressCallbacksInterval - timeDiff)
        }

        if (this.isComplete()) {
          clearTimeout(this._progeressId)
          triggerProgress()
          this.currentSpeed = 0
          this.averageSpeed = 0
          uploader._trigger('fileSuccess', rootFile, this, message, chunk)
          if (rootFile.isComplete()) {
            uploader._trigger('fileComplete', rootFile, this)
          }
        } else if (!this._progeressId) {
          triggerProgress()
        }
        break
      }
      case STATUS.RETRY:
        uploader._trigger('fileRetry', rootFile, this, chunk)
        break
      default:
        break
    }
  }

  _updateUploadedChunks(message, chunk) {
    const { checkChunkUploadedByResponse, testChunks } = this.uploader.opts

    if (testChunks && checkChunkUploadedByResponse) {
      const { xhr } = chunk
      utils.each(this.chunks, (_chunk) => {
        if (_chunk.tested) {
          return
        }

        const uploaded = checkChunkUploadedByResponse.call(this, _chunk, message)
        if (_chunk === chunk && !uploaded) {
          _chunk.xhr = null
        }
        if (uploaded) {
          _chunk.xhr = xhr
        }
        _chunk.tested = true
      }, this)

      if (!this._firstResponse) {
        this._firstResponse = true
        this.uploader.upload(true)
      } else {
        this.uploader.uploadNextChunk()
      }
      return
    }

    this.uploader.uploadNextChunk()
  }

  _error() {
    this.error = true
    this.allError = true

    let parent = this.parent
    while (parent && parent !== this.uploader) {
      parent._errorFiles.push(this)
      parent.error = true
      if (parent._errorFiles.length === parent.files.length) {
        parent.allError = true
      }
      parent = parent.parent
    }
  }

  _resetError() {
    this.error = false
    this.allError = false

    let parent = this.parent
    while (parent && parent !== this.uploader) {
      const index = parent._errorFiles.indexOf(this)
      if (index !== -1) {
        parent._errorFiles.splice(index, 1)
      }
      parent.allError = false
      if (parent._errorFiles.length === 0) {
        parent.error = false
      }
      parent = parent.parent
    }
  }

  isComplete() {
    if (!this.completed) {
      let outstanding = false

      this._eachAccess((file) => {
        if (!file.isComplete()) {
          outstanding = true
          return false
        }
        return true
      }, function checkFileCompletion() {
        if (this.error) {
          outstanding = true
          return
        }

        utils.each(this.chunks, (chunk) => {
          const status = chunk.status()
          if (
            status === Chunk.STATUS.ERROR
            || status === Chunk.STATUS.PENDING
            || status === Chunk.STATUS.UPLOADING
            || status === Chunk.STATUS.READING
            || chunk.preprocessState === 1
            || chunk.readState === 1
          ) {
            outstanding = true
            return false
          }
          return true
        })
      })

      this.completed = !outstanding
    }

    return this.completed
  }

  isUploading() {
    let uploading = false

    this._eachAccess((file) => {
      if (file.isUploading()) {
        uploading = true
        return false
      }
      return true
    }, function checkUploading() {
      utils.each(this.chunks, (chunk) => {
        if (chunk.status() === Chunk.STATUS.UPLOADING) {
          uploading = true
          return false
        }
        return true
      })
    })

    return uploading
  }

  resume() {
    this._eachAccess((file) => {
      file.resume()
    }, function resumeFile() {
      this.paused = false
      this.aborted = false
      this.uploader.upload()
    })

    this.paused = false
    this.aborted = false
  }

  pause() {
    this._eachAccess((file) => {
      file.pause()
    }, function pauseFile() {
      this.paused = true
      this.abort()
    })

    this.paused = true
  }

  cancel() {
    this.uploader.removeFile(this)
  }

  retry(file) {
    const fileRetry = (targetFile) => {
      if (targetFile.error) {
        targetFile.bootstrap()
      }
    }

    if (file) {
      file.bootstrap()
    } else {
      this._eachAccess(fileRetry, function retryFile() {
        this.bootstrap()
      })
    }

    this.uploader.upload()
  }

  abort(reset) {
    if (this.aborted) {
      return
    }

    this.currentSpeed = 0
    this.averageSpeed = 0
    this.aborted = !reset

    const chunks = this.chunks
    if (reset) {
      this.chunks = []
    }

    utils.each(chunks, (chunk) => {
      if (chunk.status() === Chunk.STATUS.UPLOADING) {
        chunk.abort()
        this.uploader.uploadNextChunk()
      }
    }, this)
  }

  progress() {
    let totalDone = 0
    let totalSize = 0
    let result = 0

    this._eachAccess((file, index) => {
      totalDone += file.progress() * file.size
      totalSize += file.size
      if (index === this.files.length - 1) {
        result = totalSize > 0 ? totalDone / totalSize : (this.isComplete() ? 1 : 0)
      }
    }, function fileProgress() {
      if (this.error) {
        result = 1
        return
      }

      if (this.chunks.length === 1) {
        this._prevProgress = Math.max(this._prevProgress, this.chunks[0].progress())
        result = this._prevProgress
        return
      }

      let bytesLoaded = 0
      utils.each(this.chunks, (chunk) => {
        bytesLoaded += chunk.progress() * (chunk.endByte - chunk.startByte)
      })

      const percent = bytesLoaded / this.size
      this._prevProgress = Math.max(this._prevProgress, percent > 0.9999 ? 1 : percent)
      result = this._prevProgress
    })

    return result
  }

  getSize() {
    let size = 0
    this._eachAccess((file) => {
      size += file.size
    }, function collectSize() {
      size += this.size
    })
    return size
  }

  getFormatSize() {
    return utils.formatSize(this.getSize())
  }

  getRoot() {
    if (this.isRoot) {
      return this
    }

    let parent = this.parent
    while (parent) {
      if (parent.parent === this.uploader) {
        return parent
      }
      parent = parent.parent
    }

    return this
  }

  sizeUploaded() {
    let size = 0
    this._eachAccess((file) => {
      size += file.sizeUploaded()
    }, function collectUploadedSize() {
      utils.each(this.chunks, (chunk) => {
        size += chunk.sizeUploaded()
      })
    })
    return size
  }

  timeRemaining() {
    let result = 0
    let sizeDelta = 0
    let averageSpeed = 0

    this._eachAccess((file, index) => {
      if (!file.paused && !file.error) {
        sizeDelta += file.size - file.sizeUploaded()
        averageSpeed += file.averageSpeed
      }
      if (index === this.files.length - 1) {
        result = calculateRemaining(sizeDelta, averageSpeed)
      }
    }, function fileTimeRemaining() {
      if (this.paused || this.error) {
        result = 0
        return
      }

      const delta = this.size - this.sizeUploaded()
      result = calculateRemaining(delta, this.averageSpeed)
    })

    return result
  }

  removeFile(file) {
    if (file.isFolder) {
      while (file.files.length > 0) {
        const target = file.files[file.files.length - 1]
        this._removeFile(target)
      }
    }

    this._removeFile(file)
  }

  _delFilePath(file) {
    if (file.path && this.filePaths) {
      delete this.filePaths[file.path]
    }

    utils.each(file.fileList, (childFile) => {
      this._delFilePath(childFile)
    }, this)
  }

  _removeFile(file) {
    if (!file.isFolder) {
      utils.each(this.files, (currentFile, index) => {
        if (currentFile === file) {
          this.files.splice(index, 1)
          return false
        }
        return true
      }, this)

      file.abort()

      let parent = file.parent
      while (parent && parent !== this) {
        const nextParent = parent.parent
        parent._removeFile(file)
        parent = nextParent
      }
    }

    if (file.parent === this) {
      utils.each(this.fileList, (currentFile, index) => {
        if (currentFile === file) {
          this.fileList.splice(index, 1)
          return false
        }
        return true
      }, this)
    }

    if (!this.isRoot && this.isFolder && this.files.length === 0) {
      this.parent._removeFile(this)
      this.uploader._delFilePath(this)
    }

    file.parent = null
  }

  getType() {
    if (this.isFolder) {
      return 'folder'
    }
    return this.file.type && this.file.type.split('/')[1]
  }

  getExtension() {
    if (this.isFolder) {
      return ''
    }
    return this.name.slice((~-this.name.lastIndexOf('.') >>> 0) + 2).toLowerCase()
  }
}

function calculateRemaining(delta, averageSpeed) {
  if (delta && !averageSpeed) {
    return Number.POSITIVE_INFINITY
  }
  if (!delta && !averageSpeed) {
    return 0
  }
  return Math.floor(delta / averageSpeed)
}

function parsePaths(path) {
  const parts = path.split('/')
  parts.splice(parts.length - 1, 1)

  const paths = []
  for (let index = 1; index <= parts.length; index += 1) {
    paths.push(`${parts.slice(0, index).join('/')}/`)
  }
  return paths
}

export default File

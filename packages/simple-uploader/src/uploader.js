import Chunk from './chunk.js'
import event from './event.js'
import File from './file.js'
import utils from './utils.js'

const version = '__VERSION__'

const isServer = typeof window === 'undefined'
const ie10plus = isServer ? false : window.navigator.msPointerEnabled
let uploaderSliceName = 'slice'

const support = (() => {
  if (isServer) {
    return false
  }

  let isSupported = utils.isDefined(window.File)
    && utils.isDefined(window.Blob)
    && utils.isDefined(window.FileList)

  if (isSupported) {
    const blobPrototype = window.Blob.prototype
    utils.each(['slice', 'webkitSlice', 'mozSlice'], (name) => {
      if (blobPrototype[name]) {
        uploaderSliceName = name
        return false
      }
      return true
    })
    isSupported = Boolean(blobPrototype[uploaderSliceName])
  }

  return isSupported
})()

const supportDirectory = (() => {
  if (isServer) {
    return false
  }

  const input = window.document.createElement('input')
  input.type = 'file'
  return 'webkitdirectory' in input || 'directory' in input
})()

function webAPIFileRead(fileObj, fileType, startByte, endByte, chunk) {
  chunk.readFinished(fileObj.file[Uploader.sliceName](startByte, endByte, fileType))
}

class Uploader extends File {
  static sliceName = uploaderSliceName
  static version = version

  static defaults = {
    chunkSize: 1024 * 1024,
    forceChunkSize: false,
    simultaneousUploads: 3,
    singleFile: false,
    fileParameterName: 'file',
    progressCallbacksInterval: 500,
    speedSmoothingFactor: 0.1,
    query: {},
    headers: {},
    withCredentials: false,
    preprocess: null,
    method: 'multipart',
    testMethod: 'GET',
    uploadMethod: 'POST',
    prioritizeFirstAndLastChunk: false,
    allowDuplicateUploads: false,
    target: '/',
    testChunks: true,
    generateUniqueIdentifier: null,
    maxChunkRetries: 0,
    chunkRetryInterval: null,
    permanentErrors: [404, 415, 500, 501],
    successStatuses: [200, 201, 202],
    onDropStopPropagation: false,
    initFileFn: null,
    readFileFn: webAPIFileRead,
    checkChunkUploadedByResponse: null,
    checkChunkUploaded: null,
    initialPaused: false,
    processResponse(response, cb) {
      cb(null, response)
    },
    processParams(params) {
      return params
    },
  }

  static utils = utils
  static event = event
  static File = File
  static Chunk = Chunk

  constructor(opts) {
    super(null, null, null, { isRoot: true })

    this.support = support
    /* istanbul ignore if */
    if (!this.support) {
      return
    }

    this.supportDirectory = supportDirectory
    utils.defineNonEnumerable(this, 'filePaths', {})
    this.opts = utils.extend({}, Uploader.defaults, opts || {})
    this.preventEvent = utils.bind(this._preventEvent, this)
    this.paused = this.opts.initialPaused
  }

  on(name, func) {
    return event.on.call(this, name, func)
  }

  off(name, func) {
    return event.off.call(this, name, func)
  }

  trigger(name, ...args) {
    return event.trigger.call(this, name, ...args)
  }

  _trigger(name, ...args) {
    const preventDefault = !this.trigger(name, ...args)
    if (name !== 'catchAll') {
      return !(!this.trigger('catchAll', name, ...args) || preventDefault)
    }
    return !preventDefault
  }

  _triggerAsync(...args) {
    utils.nextTick(function triggerAsync() {
      this._trigger(...args)
    }, this)
  }

  addFiles(files, evt) {
    const addedFiles = []
    const oldFileListLength = this.fileList.length

    utils.each(files, (file) => {
      const isValidIEFile = !ie10plus || (ie10plus && file.size > 0)
      const isDotDirectory = file.size % 4096 === 0 && (file.name === '.' || file.fileName === '.')
      if (!isValidIEFile || isDotDirectory) {
        return
      }

      const uniqueIdentifier = this.generateUniqueIdentifier(file)
      if (!this.opts.allowDuplicateUploads && this.getFromUniqueIdentifier(uniqueIdentifier)) {
        return
      }

      const nextFile = new File(this, file, this)
      nextFile.uniqueIdentifier = uniqueIdentifier

      if (this._trigger('fileAdded', nextFile, evt)) {
        addedFiles.push(nextFile)
      }
      else {
        File.prototype.removeFile.call(this, nextFile)
      }
    }, this)

    const newFileList = this.fileList.slice(oldFileListLength)
    if (!this._trigger('filesAdded', addedFiles, newFileList, evt)) {
      utils.each(newFileList, (file) => {
        File.prototype.removeFile.call(this, file)
      }, this)
      return
    }

    utils.each(addedFiles, (file) => {
      if (this.opts.singleFile && this.files.length > 0) {
        this.removeFile(this.files[0])
      }
      this.files.push(file)
    }, this)

    this._trigger('filesSubmitted', addedFiles, newFileList, evt)
  }

  addFile(file, evt = null) {
    this.addFiles([file], evt)
  }

  cancel() {
    for (let index = this.fileList.length - 1; index >= 0; index -= 1) {
      this.fileList[index].cancel()
    }
  }

  removeFile(file) {
    File.prototype.removeFile.call(this, file)
    this._trigger('fileRemoved', file)
  }

  generateUniqueIdentifier(file) {
    const { generateUniqueIdentifier: custom } = this.opts
    if (utils.isFunction(custom)) {
      return custom(file)
    }

    const relativePath = file.relativePath || file.webkitRelativePath || file.fileName || file.name
    return `${file.size}-${relativePath.replace(/[^\w-]/g, '')}`
  }

  getFromUniqueIdentifier(uniqueIdentifier) {
    let match = false
    utils.each(this.files, (file) => {
      if (file.uniqueIdentifier === uniqueIdentifier) {
        match = file
        return false
      }
      return true
    })
    return match
  }

  uploadNextChunk(preventEvents = false) {
    let found = false
    const pendingStatus = Chunk.STATUS.PENDING
    const checkChunkUploadedByResponse = this.opts.testChunks ? this.opts.checkChunkUploadedByResponse : null

    if (this.opts.prioritizeFirstAndLastChunk) {
      utils.each(this.files, (file) => {
        if (file.paused) {
          return
        }
        if (checkChunkUploadedByResponse && !file._firstResponse && file.isUploading()) {
          return
        }

        if (file.chunks.length > 0 && file.chunks[0].status() === pendingStatus) {
          file.chunks[0].send()
          found = true
          return false
        }

        const lastChunk = file.chunks[file.chunks.length - 1]
        if (file.chunks.length > 1 && lastChunk.status() === pendingStatus) {
          lastChunk.send()
          found = true
          return false
        }

        return true
      })

      if (found) {
        return true
      }
    }

    utils.each(this.files, (file) => {
      if (!file.paused) {
        if (checkChunkUploadedByResponse && !file._firstResponse && file.isUploading()) {
          return
        }

        utils.each(file.chunks, (chunk) => {
          if (chunk.status() === pendingStatus) {
            chunk.send()
            found = true
            return false
          }
          return true
        })
      }

      if (found) {
        return false
      }
      return true
    })

    if (found) {
      return true
    }

    let outstanding = false
    utils.each(this.files, (file) => {
      if (!file.isComplete()) {
        outstanding = true
        return false
      }
      return true
    })

    if (!outstanding && !preventEvents && this.files.length > 0) {
      this._triggerAsync('complete')
    }

    return outstanding
  }

  upload(preventEvents = false) {
    const uploadingCount = this._shouldUploadNext()
    if (uploadingCount === false) {
      return
    }

    if (!preventEvents) {
      this._trigger('uploadStart')
    }

    let started = false
    for (let count = 1; count <= this.opts.simultaneousUploads - uploadingCount; count += 1) {
      started = this.uploadNextChunk(!preventEvents) || started
      if (!started && preventEvents) {
        break
      }
    }

    if (!started && !preventEvents) {
      this._triggerAsync('complete')
    }
  }

  _shouldUploadNext() {
    let count = 0
    let shouldUpload = true
    const { simultaneousUploads } = this.opts

    utils.each(this.files, (file) => {
      utils.each(file.chunks, (chunk) => {
        if (chunk.status() === Chunk.STATUS.UPLOADING) {
          count += 1
          if (count >= simultaneousUploads) {
            shouldUpload = false
            return false
          }
        }
        return true
      })
      return shouldUpload
    })

    return shouldUpload && count
  }

  assignBrowse(domNodes, isDirectory, singleFile, attributes) {
    const nodes = typeof domNodes.length === 'undefined' ? [domNodes] : domNodes

    utils.each(nodes, (domNode) => {
      let input
      if (domNode.tagName === 'INPUT' && domNode.type === 'file') {
        input = domNode
      }
      else {
        input = document.createElement('input')
        input.setAttribute('type', 'file')
        utils.extend(input.style, {
          visibility: 'hidden',
          position: 'absolute',
          width: '1px',
          height: '1px',
        })
        domNode.append(input)
        domNode.addEventListener('click', () => {
          if (domNode.tagName.toLowerCase() === 'label') {
            return
          }
          input.click()
        }, false)
      }

      if (!this.opts.singleFile && !singleFile) {
        input.setAttribute('multiple', 'multiple')
      }
      if (isDirectory) {
        input.setAttribute('webkitdirectory', 'webkitdirectory')
      }
      if (attributes) {
        utils.each(attributes, (value, key) => {
          input.setAttribute(key, value)
        })
      }

      input.addEventListener('change', (e) => {
        this._trigger(e.type, e)
        if (e.target.value) {
          this.addFiles(e.target.files, e)
          e.target.value = ''
        }
      }, false)
    }, this)
  }

  onDrop(evt) {
    this._trigger(evt.type, evt)
    if (this.opts.onDropStopPropagation) {
      evt.stopPropagation()
    }
    evt.preventDefault()
    this._parseDataTransfer(evt.dataTransfer, evt)
  }

  _parseDataTransfer(dataTransfer, evt) {
    if (dataTransfer.items && dataTransfer.items[0] && dataTransfer.items[0].webkitGetAsEntry) {
      this.webkitReadDataTransfer(dataTransfer, evt)
      return
    }
    this.addFiles(dataTransfer.files, evt)
  }

  webkitReadDataTransfer(dataTransfer, evt) {
    let queue = dataTransfer.items.length
    const files = []

    const decrement = () => {
      queue -= 1
      if (queue === 0) {
        this.addFiles(files, evt)
      }
    }

    const fileReadSuccess = (file, fullPath) => {
      file.relativePath = fullPath.slice(1)
      files.push(file)
      decrement()
    }

    const readError = (fileError) => {
      throw fileError
    }

    const readDirectory = (reader) => {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          decrement()
          return
        }

        queue += entries.length
        utils.each(entries, (entry) => {
          if (entry.isFile) {
            const { fullPath } = entry
            entry.file((file) => {
              fileReadSuccess(file, fullPath)
            }, readError)
          }
          else if (entry.isDirectory) {
            readDirectory(entry.createReader())
          }
        })
        readDirectory(reader)
      }, readError)
    }

    utils.each(dataTransfer.items, (item) => {
      const entry = item.webkitGetAsEntry()
      if (!entry) {
        decrement()
        return
      }

      if (entry.isFile) {
        fileReadSuccess(item.getAsFile(), entry.fullPath)
        return
      }

      readDirectory(entry.createReader())
    })
  }

  _assignHelper(domNodes, handles, remove) {
    const nodes = typeof domNodes.length === 'undefined' ? [domNodes] : domNodes
    const eventMethod = remove ? 'removeEventListener' : 'addEventListener'

    utils.each(nodes, (domNode) => {
      utils.each(handles, (handler, name) => {
        domNode[eventMethod](name, handler, false)
      }, this)
    }, this)
  }

  _preventEvent(e) {
    utils.preventEvent(e)
    this._trigger(e.type, e)
  }

  assignDrop(domNodes) {
    this._onDrop = utils.bind(this.onDrop, this)
    this._assignHelper(domNodes, {
      dragover: this.preventEvent,
      dragenter: this.preventEvent,
      dragleave: this.preventEvent,
      drop: this._onDrop,
    })
  }

  unAssignDrop(domNodes) {
    this._assignHelper(domNodes, {
      dragover: this.preventEvent,
      dragenter: this.preventEvent,
      dragleave: this.preventEvent,
      drop: this._onDrop,
    }, true)
    this._onDrop = null
  }
}

export default Uploader

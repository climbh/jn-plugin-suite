const fs = require('node:fs')
const path = require('node:path')
const cors = require('cors')
const express = require('express')

const app = express()

const port = Number(process.env.PORT || 8890)

app.use(cors())

function randomSleep(min, max) {
  const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(resolve => setTimeout(resolve, sleepTime))
}

function drainRequest(req) {
  return new Promise((resolve, reject) => {
    let size = 0

    req.on('data', (chunk) => {
      size += chunk.length
    })
    req.on('end', () => {
      resolve(size)
    })
    req.on('error', reject)
    req.on('aborted', () => {
      reject(new Error('Upload request aborted'))
    })
  })
}

app.get('/kinso-file-server/file/v1/corp/rapidupload', (req, res) => {
  const data = {
    fileId: '793411992976728068',
    imageFlag: false,
    needMergeFile: false,
    skipUploaded: false,
    supportChunkFlag: false,
  }
  if (req.query.totalSize > 20 * 1024 * 1024) {
    data.supportChunkFlag = true
    data.chunkSize = 2 * 1024 * 1024
    data.uploadedChunk = []
  }
  res.send({
    code: '000000',
    data,
    status: 200,
    success: true,
  })
})
app.post('/kinso-file-server/file/v1/corp/rapidupload', async (req, res) => {
  try {
    const [size] = await Promise.all([
      drainRequest(req),
      randomSleep(1000, 3000),
    ])

    res.send({
      code: '000000',
      data: {
        fileId: Math.floor(Math.random() * 1000000000000000000).toString(),
        size,
      },
      status: 200,
      success: true,
    })
  }
  catch (error) {
    res.status(400).send({
      code: 'UPLOAD_ERROR',
      message: error.message,
      status: 400,
      success: false,
    })
  }
})

app.post('/kinso-file-server/file/v1/corp/upload', async (req, res) => {
  try {
    const [size] = await Promise.all([
      drainRequest(req),
      randomSleep(3000, 5000),
    ])

    res.send({
      code: '000000',
      data: {
        fileId: Math.floor(Math.random() * 1000000000000000000).toString(),
        imageFlag: false,
        needMergeFile: false,
        skipUploaded: false,
        supportChunkFlag: false,
        size,
      },
      status: 200,
      success: true,
    })
  }
  catch (error) {
    res.status(400).send({
      code: 'UPLOAD_ERROR',
      message: error.message,
      status: 400,
      success: false,
    })
  }
})

app.use('/kinso-file-server/file/v1/corp/upload/merge', (req, res) => {
  res.send({
    code: '000000',
    data: {
      fileId: '793411992976728068',
    },
    status: 200,
    success: true,
  })
})

app.listen(port, () => {
  console.log(`Upload server listening on port ${port}`)
})

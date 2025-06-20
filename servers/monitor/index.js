const express = require('express')
const cors = require('cors')

const app = express()

const port = 8888

app.use(cors())

// 中间件
app.use(express.text()); // 处理 text/plain 解决navigator.sendBeacon发送数据接收问题
app.use(express.urlencoded({ extended: true })); // 处理 application/x-www-form-urlencoded 解决ajax数据接收问题


app.post('/track', (req, res) => {
    console.log('%c [  ]-9', 'font-size:13px; background:blue; color:#fff;', req.body)
res.send('Hello World!')
})
app.get('/track', (req, res) => {
    // 返回1*1像素的gif
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(buffer);

})

app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})
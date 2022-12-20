process
  .on('unhandledRejection', (reason, p) => {
    console.warn('Promise 错误', reason, p)
  })
  .on('uncaughtException', err => {
    console.error('系统错误', err)
    // process.exit(1)
  })

require('./server/index') // 内部调用了 dotenv

const express = require('express')
const path = require('path')
const server = express()
const staticPath = path.resolve(__dirname, './client')
server.use(express.static(staticPath))
const port = parseInt(process.env.WEB_PORT || '', 10) || 4175
server.listen(port)

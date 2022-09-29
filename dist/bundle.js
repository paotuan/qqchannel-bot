process
  .on('unhandledRejection', (reason, p) => {
    console.warn('Promise 错误', reason, p)
  })
  .on('uncaughtException', err => {
    console.error('系统错误', err)
    // process.exit(1)
  })

require('./server/index')

const express = require('express')
const path = require('path')
const server = express()
const open = require('open')
const staticPath = path.resolve(__dirname, './client')
server.use(express.static(staticPath))
server.listen(4175)
console.log('管理后台已启动，请使用浏览器访问 http://localhost:4175 登录机器人')
open('http://localhost:4175')

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
const chalk = require('chalk')
const server = express()
const open = require('open-with-result')
const staticPath = path.resolve(__dirname, './client')
server.use(express.static(staticPath))
server.listen(4175)

const localhostUrl = 'http://localhost:4175'
console.log(chalk.bold(`管理后台已启动，请使用浏览器访问 ${localhostUrl} 登录机器人`))
;(async () => {
  try {
    await open(localhostUrl, { app: { name: open.apps.edge } })
    return true
  } catch (e) {
    // cannot find edge
  }
  try {
    await open(localhostUrl, { app: { name: open.apps.chrome } })
    return true
  } catch (e) {
    // cannot find chrome
  }
  try {
    await open(localhostUrl)
  } catch (e) {
    // ignore
  }
  // 打开的不是 edge 或 chrome，给个提示
  console.log(chalk.red('强烈建议使用 Chrome 或 Edge 打开网页，否则部分功能可能异常！'))
})()


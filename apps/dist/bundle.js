process
  .on('unhandledRejection', (reason, p) => {
    console.warn('Promise 错误', reason, p)
  })
  .on('uncaughtException', err => {
    console.error('系统错误', err)
    // process.exit(1)
  })

try {
  require('./server/index') // 内部调用了 dotenv
} catch (e) {
  console.error(e)
}

const express = require('express')
const path = require('path')
const chalk = require('chalk')
const server = express()
const staticPath = path.resolve(__dirname, './client')
server.use(express.static(staticPath))

const serverUrl = process.env.WS_SERVER_ADDR || 'localhost' // 如果通过该文件部署，必然不是前后端分离，server addr 是同一个
const port = parseInt(process.env.WEB_PORT || '', 10) || 4175
server.listen(port)

const localhostUrl = `http://${serverUrl}:${port}`
console.log(chalk.bold(`管理后台已启动，请使用浏览器访问 ${localhostUrl} 登录机器人`))
;(async () => {
  try {
    const open = require('open-with-result')
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
  } catch (e) {
    // require open 可能失败，做个保护
  }
  // 打开的不是 edge 或 chrome，给个提示
  console.log(chalk.red('强烈建议使用 Chrome 或 Edge 打开网页，否则部分功能可能异常！'))
})()


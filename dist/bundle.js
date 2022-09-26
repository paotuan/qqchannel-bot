// process.env.NODE_ENV = 'production'
require('./server/index')

const express = require('express')
const path = require('path')
const server = express()
const staticPath = path.resolve(__dirname, './client')
// console.log(__dirname, staticPath)
server.use(express.static(staticPath))
server.listen(4175)
console.log('后台已启动，请访问 http://localhost:4175')

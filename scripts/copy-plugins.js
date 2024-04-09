const path = require('path')
const fs = require('fs')

console.log('copy plugins')
const src = path.resolve(__dirname, '../packages/server/src/plugins')
const dst = path.resolve(__dirname, '../packages/dist/server/plugins')

fs.cpSync(src, dst, { recursive: true })
console.log('copy plugins finish')

const envScr = path.resolve(__dirname, '../.env')
if (fs.existsSync(envScr)) {
  const envDst = path.resolve(__dirname, '../packages/dist/server/.env')
  fs.cpSync(envScr, envDst)
  console.log('copy .env finish')
}

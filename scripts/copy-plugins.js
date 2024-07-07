const path = require('path')
const fs = require('fs')

console.log('copy plugins')
const src = path.resolve(__dirname, '../apps/server/src/plugins')
const dst = path.resolve(__dirname, '../apps/dist/server/plugins')

fs.cpSync(src, dst, { recursive: true })
console.log('copy plugins finish')

const envScr = path.resolve(__dirname, '../.env')
if (fs.existsSync(envScr)) {
  const envDst = path.resolve(__dirname, '../apps/dist/server/.env')
  fs.cpSync(envScr, envDst)
  console.log('copy .env finish')
}

const leveldownSrc = path.resolve(__dirname, '../node_modules/leveldown/prebuilds')
const leveldownDst = path.resolve(__dirname, '../apps/dist/server/prebuilds')

fs.cpSync(leveldownSrc, leveldownDst, { recursive: true })
console.log('copy napi prebuilds finish')

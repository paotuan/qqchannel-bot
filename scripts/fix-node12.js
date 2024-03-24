const path = require('path')
const fs = require('fs')

const distFile = path.resolve(__dirname, '../dist/server/index.js')

const data = fs.readFileSync(distFile)

const fix = data.toString()
  .replaceAll('require("fs/promises")', 'require("fs").promises')
  .replaceAll('require("dns/promises")', 'require("dns").promises')

fs.writeFileSync(distFile, fix)

console.log('fix node12 finished')

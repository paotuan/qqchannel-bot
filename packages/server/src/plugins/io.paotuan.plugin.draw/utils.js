/* eslint-env node */
const path = require('path')
const fs = require('fs')

const FILES_DIR = path.join(__dirname, 'files')

function getFileList(dirName) {
  let files = []
  const items = fs.readdirSync(dirName, { withFileTypes: true })
  for (const item of items) {
    if (item.isDirectory()) {
      files = [...files, ...getFileList(`${dirName}/${item.name}`)]
    } else {
      files.push(`${dirName}/${item.name}`)
    }
  }
  return files
}

module.exports = { FILES_DIR, getFileList }

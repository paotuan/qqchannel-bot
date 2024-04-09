/* eslint-env node */
const path = require('path')
const fs = require('fs')
const { FILES_DIR, getFileList } = require('./utils')

const CONVERT_DIR = path.join(__dirname, '_convert')

function convertOtherFormatFiles() {
  if (!fs.existsSync(CONVERT_DIR)) {
    return
  }
  const files2convert = getFileList(CONVERT_DIR)
  files2convert.forEach(filename => {
    if (filename.endsWith('.json')) {
      try {
        const data = require(filename)
        replaceAndCopyToFiles(filename, data)
        console.log(`[牌堆]转换成功：${filename}`)
      } catch (e) {
        console.error(`[牌堆]转换失败：${filename}`, e)
      }
    }
  })
}

function replaceAndCopyToFiles(filename, content) {
  const distFilename = filename.replace(CONVERT_DIR, FILES_DIR)
  const distDir = path.dirname(distFilename)
  fs.mkdirSync(distDir, { recursive: true })
  fs.writeFileSync(distFilename, JSON.stringify(content, (key, value) => {
    if (typeof value === 'string') {
      // https://stackoverflow.com/questions/12728128/regular-expression-to-match-single-bracket-pairs-but-not-double-bracket-pairs
      return value
        // 1. {%xxx} => {{>xxx}}
        .replace(/(?<!\{)\{%([^}]+)\}(?!\})/g, '{{>$1}}')
        // 2. {xxx} => {{>!xxx}}
        .replace(/(?<!\{)\{([^}]+)\}(?!\})/g, '{{>!$1}}')
        // 3. [xxx] => [[xxx]]
        .replace(/(?<!\[)\[([^\]]+)\](?!\])/g, '[[$1]]')
    }
    return value
  }, 2))
  fs.unlinkSync(filename)
}

module.exports = { convertOtherFormatFiles }

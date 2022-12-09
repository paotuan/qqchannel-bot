import * as fs from 'fs'
import * as path from 'path'

// https://www.zhangxinxu.com/wordpress/2021/01/dom-api-html-encode-decode/
export function unescapeHTML(str: string) {
  return str.replace(/&lt;|&gt;|&amp;/g, function (matches) {
    return ({
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&'
    })[matches] || ''
  })
}

// https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
export function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(to)) fs.mkdirSync(to)
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element))
    } else {
      copyFolderSync(path.join(from, element), path.join(to, element))
    }
  })
}

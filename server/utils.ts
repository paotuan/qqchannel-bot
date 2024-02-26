import fs from 'fs'
import path from 'path'
import publicIp from 'public-ip'

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

export function detectPublicIP() {
  publicIp.v4({ onlyHttps: true }).then((addr: string) => {
    console.log('您当前的公网 IP 是：' + addr)
  }).catch(() => {
    console.error('获取公网 IP 失败')
  })
}

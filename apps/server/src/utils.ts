import fs from 'fs'
import path from 'path'

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

// 允许支持 \b 退格
// https://stackoverflow.com/questions/11891653/javascript-concat-string-with-backspace
export function removeBackspaces(str: string) {
  let index = str.indexOf('\b') // str must be trimed
  while (index >= 0) {
    const left = str.substring(0, index - 1)
    const right = str.substring(index + 1)
    str = (left + right).trim()
    index = str.indexOf('\b')
  }
  return str
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

// https://github.com/sindresorhus/public-ip/blob/main/browser.js#L23C4-L23C31
const detectUrls = [
  'https://ipv4.icanhazip.com/',
  'https://api.ipify.org/'
]

async function fetchIP(url: string) {
  try {
    const res = await fetch(url, { method: 'GET' })
    const resp = await res.text()
    return resp
  } catch (e) {
    return undefined
  }
}

export async function detectPublicIP() {
  for (const url of detectUrls) {
    const addr = await fetchIP(url)
    if (addr) {
      console.log('您当前的公网 IP 是：' + addr)
      return
    }
  }
  console.error('获取公网 IP 失败（若网络本身正常，则不影响正常使用）')
}

// 获取某个文件夹名称基于 root 的路径
// dev 环境对应项目根目录
// prod 环境对应 exe 同级目录
export function resolveRootDir(dirName: string) {
  if (process.env.NODE_ENV === 'development') {
    return `../../${dirName}` // from child's package.json to root's
  } else {
    return `./${dirName}`
  }
}

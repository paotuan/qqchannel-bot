import { IncomingMessage, ServerResponse } from 'node:http'
import { extname } from 'node:path'
import fs from 'fs'
import { resolveRootDir } from '../utils'
import { INTERNAL_PLUGIN_DIR, PLUGIN_DIR } from '../service/plugin'

const IMAGE_SERVE_DIR = resolveRootDir('images')
const PLUGIN_SERVE_DIR = process.env.NODE_ENV === 'development' ? INTERNAL_PLUGIN_DIR : PLUGIN_DIR

// https://github.com/adrian-deniz/nodejs-static-file-server/blob/master/index.js
export function serveStatic(request: IncomingMessage, response: ServerResponse) {
  console.log('request', request.url) // '/images.png'
  const requestUrl = decodeURIComponent(request.url ?? '') // 路径中可能存在中文，会被自动 encode
  const filePath = requestUrl.startsWith('/__plugins__/')
    ? requestUrl.replace(/^\/__plugins__/, PLUGIN_SERVE_DIR)
    : IMAGE_SERVE_DIR + requestUrl
  const ext = extname(filePath).toLowerCase()
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == 'ENOENT') {
        response.writeHead(404, { 'Content-Type': 'text/html' })
        response.end('404', 'utf-8')
      } else {
        response.writeHead(500)
        response.end(`static server error: ${error.code}`)
      }
    } else {
      response.writeHead(200, { 'Content-Type': contentType })
      response.end(content, 'utf-8')
    }
  })
}

const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.ico' : 'image/x-icon'
}

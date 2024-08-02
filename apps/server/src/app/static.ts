import { IncomingMessage, ServerResponse } from 'node:http'
import { extname } from 'node:path'
import fs from 'fs'
import { resolveRootDir } from '../utils'

const IMAGE_SERVE_DIR = resolveRootDir('images')

// https://github.com/adrian-deniz/nodejs-static-file-server/blob/master/index.js
export function serveStatic(request: IncomingMessage, response: ServerResponse) {
  console.log('request', request.url) // '/images.png'
  const filePath = IMAGE_SERVE_DIR + request.url
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

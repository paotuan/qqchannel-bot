import { VERSION_NAME } from '@paotuan/types'
import path from 'path'
import dotenv from 'dotenv'
import { detectPublicIP } from './utils'
import { setupServer } from './app/http'

// 显式指定 env 文件路径，使 ncc 的静态分析器能自动打包 env 文件到 dist/server 路径下
// @see https://github.com/vercel/webpack-asset-relocator-loader#asset-relocation
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
console.log('跑团 IO 机器人 - 版本：', VERSION_NAME)
detectPublicIP()
const port = parseInt(process.env.WS_SERVER_PORT || '', 10) || 4174
setupServer(port)

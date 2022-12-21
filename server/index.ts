import { Wss } from './app/wss'
import { VERSION_NAME } from '../interface/version'
import * as path from 'path'
import * as dotenv from 'dotenv'

// 显式指定 env 文件路径，使 ncc 的静态分析器能自动打包 env 文件到 dist/server 路径下
// @see https://github.com/vercel/webpack-asset-relocator-loader#asset-relocation
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
console.log('QQ 频道跑团机器人 - 版本：', VERSION_NAME)
const port = parseInt(process.env.WS_SERVER_PORT || '', 10) || 4174
new Wss(port)

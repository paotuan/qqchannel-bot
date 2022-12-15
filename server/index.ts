import { Wss } from './app/wss'
import { VERSION_NAME } from '../interface/version'
import * as dotenv from 'dotenv'

dotenv.config()
console.log('QQ 频道跑团机器人 - 版本：', VERSION_NAME)
const port = parseInt(process.env.WS_SERVER_PORT || '', 10) || 4174
new Wss(port)

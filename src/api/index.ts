import ws from './ws'
import { IBotInfoResp, IChannel } from '../../interface/common'
import { useBotStore } from '../store/bot'
import { useChannelStore } from '../store/channel'

ws.on('bot/login', message => {
  console.log('login success')
  const bot = useBotStore()
  bot.loginState = message.success ? 'LOGIN' : 'NOT_LOGIN'
  // 极端情况下会有异步的问题，不过这里很快，就不管了
  localStorage.setItem('appid', bot.appid)
  localStorage.setItem('token', bot.token)
})

ws.on('bot/info', message => {
  const bot = useBotStore()
  bot.info = message.data as IBotInfoResp
})

ws.on('channel/list', data => {
  const channel = useChannelStore()
  channel.list = data.data as IChannel[] | null
  channel.initGetListSuccess = data.success!
})

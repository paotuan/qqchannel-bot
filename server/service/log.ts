import qqApi from '../qqApi'
import { AvailableIntentsEventsEnum, IMessage } from 'qq-guild-bot'
import config from './common'
import wss from '../wss'
import type { ILogPushResp } from '../../interface/common'

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
  const msg = data.msg as IMessage
  // 无视未监听的频道消息
  const channel = msg.channel_id
  if (channel !== config.listenToChannelId) return

  // 无视非文本消息 TODO 后面可以支持图片消息
  const content = msg.content?.trim()
  if (!content) return

  // 无视 @机器人 和指令消息
  const botUserId = qqApi.botInfo?.id
  if (content.startsWith(`<@!${botUserId}> `) || content.startsWith('.') || content.startsWith('。')) {
    return
  }

  // 发送给客户端
  wss.send<ILogPushResp>(null, {
    cmd: 'log/push',
    success: true,
    data: [{
      msgId: msg.id,
      msgType: 'text',
      userId: msg.author.id,
      username: msg.author.username,
      content: content,
      timestamp: msg.timestamp
    }]
  })
})

import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import { AvailableIntentsEventsEnum, IMessage } from 'qq-guild-bot'
import type { ILogPushResp, ILog } from '../../../interface/common'

export class LogManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }

  constructor(api: QApi) {
    makeAutoObservable<this, 'api' | 'wss'>(this, { api: false, wss: false })
    this.api = api
    this.initListeners()
  }

  private handleLogPush(msg: IMessage) {
    // 无视非文本消息 TODO 后面可以支持图片消息
    const content = msg.content?.trim()
    if (!content) return

    // 发送给客户端
    this.pushToClients(msg.guild_id, msg.channel_id, {
      msgId: msg.id,
      msgType: 'text',
      userId: msg.author.id,
      username: msg.member.nick || msg.author.username,
      content: content,
      timestamp: msg.timestamp
    })
  }

  pushToClients(guildId: string, channelId: string, ...logs: ILog[]) {
    // log @ 替换
    logs.forEach(log => {
      if (log.msgType === 'text' && log.content) {
        log.content = log.content.replace(/<@!(\d+)>/g, (_, userId: string) => {
          const user = this.api.guilds.findUser(userId, guildId)
          let name = user ? user.nick || user.username || user.id : userId
          if (user?.bot) {
            name = name.replace(/-测试中$/, '')
          }
          return `@${name} `
        })
      }
    })
    this.wss.sendToChannel<ILogPushResp>(channelId, {
      cmd: 'log/push',
      success: true,
      data: logs
    })
  }

  private initListeners() {
    this.api.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
      if (this.filtered(data.msg.channel_id)) return
      // console.log(`[Log][GUILD_MESSAGES][${data.eventType}]`, data.msg)
      switch (data.eventType) {
      case 'MESSAGE_CREATE':
        this.handleLogPush(data.msg as IMessage)
        break
      case 'MESSAGE_DELETE':
        break
      }
    })
  }

  private filtered(channelId: string) {
    return !this.wss.listeningChannels.includes(channelId)
  }
}

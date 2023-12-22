import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import { AvailableIntentsEventsEnum, IMessage } from 'qq-guild-bot'
import type { ILogPushResp, ILog } from '../../../interface/common'
import { createLogger, transports, format, type Logger } from 'winston'

export class LogManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }

  constructor(api: QApi) {
    makeAutoObservable<this, 'api' | 'wss' | 'backgroundLoggers'>(this, { api: false, wss: false, backgroundLoggers: false })
    this.api = api
    this.initListeners()
  }

  private handleLogPush(msg: IMessage) {
    // 是否有文本元素
    const content = msg.content?.trim()
    if (content) {
      this.pushToClients(msg.guild_id, msg.channel_id, {
        msgId: msg.id,
        msgType: 'text',
        userId: msg.author.id,
        username: msg.member.nick || msg.author.username,
        content: content,
        timestamp: msg.timestamp
      })
    }
    // 是否有图片元素 // 分开判断，以拆分简单的图文混排消息
    const attachments = msg.attachments || []
    attachments.forEach((attach, i) => {
      if (attach.url) {
        this.pushToClients(msg.guild_id, msg.channel_id, {
          msgId: `${msg.id}-${i}`, // 拼接 id 以防止 msgid 重复
          msgType: 'image',
          userId: msg.author.id,
          username: msg.member.nick || msg.author.username,
          content: attach.url,
          timestamp: msg.timestamp
        })
      }
    })
  }

  pushToClients(guildId: string, channelId: string, ...logs: ILog[]) {
    // log @ 替换
    logs.forEach(log => {
      if (log.msgType === 'text' && log.content) {
        log.content = log.content.replace(/<@!(\d+)>/g, (_, userId: string) => {
          const user = this.api.guilds.findUser(userId, guildId)
          let name = user?.persona ?? userId
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

    // 记录后台 log
    if (this.backgroundLogEnabled[channelId]) {
      this.backgroundLog(guildId, channelId, logs)
    }
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

  // region 后台 log
  private backgroundLogEnabled: Record<string, boolean> = {}

  // channelId => logger
  private readonly backgroundLoggers: Record<string, Logger> = {}
  // 上一次说话人 channelId => username
  private readonly lastUser: Record<string, string> = {}

  private getBackgroundLogger(guildId: string, channelId: string) {
    if (!this.backgroundLoggers[channelId]) {
      const channel = this.api.guilds.findChannel(channelId, guildId)
      const channelName = channel?.name ?? channelId
      this.backgroundLoggers[channelId] = createLogger({
        format: backgroundLogFormatter,
        transports: new transports.File({ filename: `logs/${channelName}.txt`, maxsize: 1024 * 1024 })
      })
    }
    return this.backgroundLoggers[channelId]
  }

  private backgroundLog(guildId: string, channelId: string, logs: ILog[]) {
    const logger = this.getBackgroundLogger(guildId, channelId)
    logs.forEach(log => {
      logger.info({ message: log, lastUser: this.lastUser[channelId] })
      this.lastUser[channelId] = log.username || log.userId
    })
  }

  setBackgroundLogEnabled(channelId: string, enabled: boolean) {
    this.backgroundLogEnabled[channelId] = enabled
  }
  // endregion
}

const backgroundLogFormatter = format.printf(info => {
  const message = info.message as ILog
  const lastUser = info.lastUser as string | undefined
  const user = message.username || message.userId
  const content = message.msgType === 'text' ? message.content : `[图片](https://${message.content})`
  if (user === lastUser) {
    return content
  } else {
    const date = new Date(message.timestamp)
    const pad2 = (v: number) => String(v).padStart(2, '0')
    const timestamp = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
    return `${user} ${timestamp}\n${content}`
  }
})

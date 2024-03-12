import { makeAutoObservable } from 'mobx'
import type { ILogPushResp, ILog } from '../../../interface/common'
import { createLogger, transports, format, type Logger } from 'winston'
import { Bot } from '../../adapter/Bot'
import { Session } from '@satorijs/satori'
import { ChannelUnionId, getChannelUnionId } from '../../adapter/utils'

export class LogManager {
  private readonly bot: Bot
  private get wss() { return this.bot.wss }

  constructor(bot: Bot) {
    makeAutoObservable<this, 'backgroundLoggers'>(this, { backgroundLoggers: false })
    this.bot = bot
    // this.initListeners()
  }

  private get platform() {
    return this.bot.platform
  }

  onReceivedMessage(session: Session) {
    // todo 暂时全当成文本
    const content = session.content
    if (content) {
      this.pushToClients(session.guildId, session.channelId, {
        msgId: session.messageId,
        msgType: 'text',
        userId: session.userId,
        username: session.author.name ?? session.userId,
        content: content,
        timestamp: String(session.timestamp)
      })
    }
  }

  // private handleLogPush(msg: IMessage) {
  //   // 是否有文本元素
  //   const content = msg.content?.trim()
  //   if (content) {
  //     this.pushToClients(msg.guild_id, msg.channel_id, {
  //       msgId: msg.id,
  //       msgType: 'text',
  //       userId: msg.author.id,
  //       username: msg.member.nick || msg.author.username,
  //       content: content,
  //       timestamp: msg.timestamp
  //     })
  //   }
  //   // 是否有图片元素 // 分开判断，以拆分简单的图文混排消息
  //   const attachments = msg.attachments || []
  //   attachments.forEach((attach, i) => {
  //     if (attach.url) {
  //       this.pushToClients(msg.guild_id, msg.channel_id, {
  //         msgId: `${msg.id}-${i}`, // 拼接 id 以防止 msgid 重复
  //         msgType: 'image',
  //         userId: msg.author.id,
  //         username: msg.member.nick || msg.author.username,
  //         content: attach.url,
  //         timestamp: msg.timestamp
  //       })
  //     }
  //   })
  // }

  pushToClients(guildId: string, channelId: string, ...logs: ILog[]) {
    const channelUnionId = getChannelUnionId(this.platform, guildId, channelId)
    // log @ 替换
    logs.forEach(log => {
      if (log.msgType === 'text' && log.content) {
        // todo at处理
        // log.content = log.content.replace(/<@!(\d+)>/g, (_, userId: string) => {
        //   const user = this.bot.guilds.findUser(userId, guildId)
        //   let name = user?.name ?? userId
        //   if (user?.bot) {
        //     name = name.replace(/-测试中$/, '')
        //   }
        //   return `@${name} `
        // })
      }
    })
    this.wss.sendToChannel<ILogPushResp>(channelUnionId, {
      cmd: 'log/push',
      success: true,
      data: logs
    })

    // 记录后台 log
    if (this.backgroundLogEnabled[channelUnionId]) {
      this.backgroundLog(guildId, channelId, logs)
    }
  }

  // region 后台 log
  private backgroundLogEnabled: Record<ChannelUnionId, boolean> = {}

  // channelUnionId => logger
  private readonly backgroundLoggers: Record<ChannelUnionId, Logger> = {}
  // 上一次说话人 channelUnionId => username
  private readonly lastUser: Record<ChannelUnionId, string> = {}

  private getBackgroundLogger(guildId: string, channelId: string) {
    const channelUnionId = getChannelUnionId(this.platform, guildId, channelId)
    if (!this.backgroundLoggers[channelUnionId]) {
      const channel = this.bot.guilds.findChannel(channelId, guildId)
      const channelName = channel?.name ?? channelId
      this.backgroundLoggers[channelUnionId] = createLogger({
        format: backgroundLogFormatter,
        transports: new transports.File({ filename: `logs/${channelName}.txt`, maxsize: 1024 * 1024 })
      })
    }
    return this.backgroundLoggers[channelUnionId]
  }

  private backgroundLog(guildId: string, channelId: string, logs: ILog[]) {
    const logger = this.getBackgroundLogger(guildId, channelId)
    const channelUnionId = getChannelUnionId(this.platform, guildId, channelId)
    logs.forEach(log => {
      logger.info({ message: log, lastUser: this.lastUser[channelUnionId] })
      this.lastUser[channelUnionId] = log.username || log.userId
    })
  }

  setBackgroundLogEnabled(channelUnionId: ChannelUnionId, enabled: boolean) {
    this.backgroundLogEnabled[channelUnionId] = enabled
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

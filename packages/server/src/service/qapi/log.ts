import { makeAutoObservable } from 'mobx'
import type { ILogPushResp, ILog } from '@paotuan/types'
import { createLogger, transports, format, type Logger } from 'winston'
import { Bot } from '../../adapter/Bot'
import { Session, Element } from '@satorijs/satori'
import { ChannelUnionId, getChannelUnionId } from '../../adapter/utils'
import { resolveRootDir } from '../../utils'

export class LogManager {
  private readonly bot: Bot
  private get wss() { return this.bot.wss }

  constructor(bot: Bot) {
    makeAutoObservable<this, 'backgroundLoggers'>(this, { backgroundLoggers: false })
    this.bot = bot
  }

  private get platform() {
    return this.bot.platform
  }

  onReceivedMessage(session: Session) {
    this.convertElementsToLogs(session.elements, session.messageId, session.userId, session.author.name ?? session.userId, String(session.timestamp), session.channelId, session.guildId)
  }

  onPushMessage(guildId: string, channelId: string, msgId: string, content: string) {
    const elements = Element.parse(content)
    const userId = this.bot.botInfo?.id ?? ''
    const username = this.bot.botInfo?.username ?? userId
    this.convertElementsToLogs(elements, msgId, userId, username, String(Date.now()), channelId, guildId)
  }

  private convertElementsToLogs(elements: Element[], msgId: string, userId: string, username: string, timestamp: string, channelId: string, guildId: string) {
    const commonArgs = { msgId, userId, username, timestamp }
    const parsedLogs: ILog[] = []

    // 用于合并连续的文本元素。理论上元素的种类有很多种，但我们可以看支持的平台实际有哪些种类再来处理
    let lastTextLog: ILog | undefined = undefined
    const ensureLastLog = () => {
      if (!lastTextLog) {
        const newLog: ILog = { ...commonArgs, msgType: 'text', content: '' }
        parsedLogs.push(newLog)
        lastTextLog = newLog
      }
      return lastTextLog
    }

    // 处理混排消息，目前根据不同平台不同，仅支持有限的类型
    elements.forEach(element => {
      if (element.type === 'text') {
        // 有些场景（例如 qq 发图片 在前面 parse 出来会带一个空格
        // 需要和之前一样做一个 trim 的逻辑
        // 不过考虑到混排场景还是比较少的，可以先简单粗暴过滤掉所有为空的 text element
        const content = element.attrs.content.trim()
        if (content) {
          const log = ensureLastLog()
          log.content += content
        }
      } else if (element.type === 'at') {
        const userId = element.attrs.id
        let name
        if (this.bot.botInfo?.id === userId) {
          name = this.bot.botInfo?.username ?? userId
        } else {
          const user = this.bot.guilds.findUser(userId, guildId)
          name = user?.name ?? userId
        }
        const content = `@${name} `
        const log = ensureLastLog()
        log.content += content
      } else if (element.type === 'img') {
        lastTextLog = undefined // 分隔开图片和文字
        parsedLogs.push({ ...commonArgs, msgType: 'image', content: element.attrs.src })
      }
    })

    parsedLogs.forEach((log, i) => {
      log.msgId = `${log.msgId}-${i}` // msg id 避重
      this.pushToClients(guildId, channelId, log)
    })
  }

  private pushToClients(guildId: string, channelId: string, ...logs: ILog[]) {
    const channelUnionId = getChannelUnionId(this.platform, guildId, channelId)
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
        transports: new transports.File({ filename: `${resolveRootDir('logs')}/${channelName}.txt`, maxsize: 1024 * 1024 })
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
  const content = message.msgType === 'text' ? message.content : `[图片](${message.content})`
  if (user === lastUser) {
    return content
  } else {
    const date = new Date(message.timestamp)
    const pad2 = (v: number) => String(v).padStart(2, '0')
    const timestamp = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
    return `${user} ${timestamp}\n${content}`
  }
})

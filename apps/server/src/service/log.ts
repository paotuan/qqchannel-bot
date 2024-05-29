import { makeAutoObservable } from 'mobx'
import type { BotContext, ICommand } from '@paotuan/config'
import type { ILogPushResp, ILog } from '@paotuan/types'
import { Bot } from '../adapter/Bot'
import { Session, Element } from '@satorijs/satori'
import { getChannelUnionId } from '../adapter/utils'
import { LogBackground } from './logBackground'

export class LogManager {
  private readonly bot: Bot
  private readonly logBackground: LogBackground
  private get wss() { return this.bot.wss }

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
    this.logBackground = new LogBackground(bot)
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
    this.logBackground.logIfNeed(guildId, channelId, logs)
  }

  handleBackgroundLogCommand(command: ICommand<BotContext>) {
    return this.logBackground.detectEnabled(command)
  }
}

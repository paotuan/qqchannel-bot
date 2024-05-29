import { createLogger, format, transports, type Logger } from 'winston'
import type { BotContext, ICommand } from '@paotuan/config'
import type { ILog } from '@paotuan/types'
import { ChannelUnionId, getChannelUnionId } from '../adapter/utils'
import { resolveRootDir } from '../utils'
import type { Bot } from '../adapter/Bot'
import { makeAutoObservable } from 'mobx'

export class LogBackground {
  private readonly bot: Bot
  private backgroundLogEnabled: Record<ChannelUnionId, boolean> = {}

  // channelUnionId => logger
  private readonly backgroundLoggers: Record<ChannelUnionId, Logger> = {}
  // 上一次说话人 channelUnionId => username
  private readonly lastUser: Record<ChannelUnionId, string> = {}

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
  }

  private get platform() {
    return this.bot.platform
  }

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

  logIfNeed(guildId: string, channelId: string, logs: ILog[]) {
    const channelUnionId = getChannelUnionId(this.platform, guildId, channelId)
    if (this.backgroundLogEnabled[channelUnionId]) {
      const logger = this.getBackgroundLogger(guildId, channelId)
      logs.forEach(log => {
        logger.info({ message: log, lastUser: this.lastUser[channelUnionId] })
        this.lastUser[channelUnionId] = log.username || log.userId
      })
    }
  }

  private setEnabled(channelUnionId: ChannelUnionId, enabled: boolean) {
    this.backgroundLogEnabled[channelUnionId] = enabled
  }

  // 根据消息判断是否是控制 log 开关的指令
  detectEnabled(userCommand: ICommand<BotContext>): [boolean, string | undefined] {
    // 私信暂不考虑
    if (userCommand.context.isDirect) {
      return [false, undefined]
    }
    const expression = userCommand.command
    if (expression.startsWith('log')) {
      const content = expression.slice(3).trim()
      if (content.startsWith('on')) {
        this.setEnabled(userCommand.context.channelUnionId as ChannelUnionId, true)
        return [true, '已开启当前子频道的后台 log 录制']
      } else if (content.startsWith('off')) {
        this.setEnabled(userCommand.context.channelUnionId as ChannelUnionId, false)
        return [true, '已关闭当前子频道的后台 log 录制']
      } else {
        return [true, '请使用 .log on/off 开启或关闭后台 log 录制功能']
      }
    } else {
      return [false, undefined]
    }
  }

}

const backgroundLogFormatter = format.printf(info => {
  const message = info.message as ILog
  const lastUser = info.lastUser as string | undefined
  const user = message.username || message.userId
  const content = message.msgType === 'text' ? message.content : `[图片](${message.content})`
  if (user === lastUser) {
    return content
  } else {
    const date = new Date(Number(message.timestamp))
    const pad2 = (v: number) => String(v).padStart(2, '0')
    const timestamp = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
    return `${user} ${timestamp}\n${content}`
  }
})

import { Bot } from '../adapter/Bot'
import { Session, Element } from '@satorijs/satori'
import type { IUserCommandContext, IUserCommand } from '@paotuan/config'
import { convertRoleIds } from '../service/dice/utils'
import { getChannelUnionId } from '../adapter/utils'

export class UserCommand implements IUserCommand {

  readonly session: Session
  command: string
  private readonly substitute: IUserCommandContext['realUser'] | undefined
  private readonly bot: Bot
  [key: string | number | symbol]: unknown

  private constructor(bot: Bot, session: Session, command: string, substitute: IUserCommandContext['realUser'] | undefined) {
    this.session = session
    this.command = command
    this.substitute = substitute
    this.bot = bot
  }

  get botId() {
    return this.bot.id
  }

  get platform() {
    return this.bot.platform
  }

  get realUser() {
    const session = this.session
    const author = session.author
    // 适配部分情况下接口不返回昵称的情况（例如 kook 表情表态）
    let username = author.nick ?? author.nickname ?? author.name ?? author.username
    if (typeof username === 'undefined') {
      const user = this.bot.guilds.findUser(session.userId, session.guildId)
      if (user) username = user.name
    }
    return {
      userId: session.userId,
      username: username || session.userId
    }
  }

  get guildId() {
    const session = this.session
    if (session.isDirect) {
      if (this.platform === 'qqguild') {
        // qq 频道提取私信机器人所在的 src guild
        return session.guildId.split('_')[0]
      } else if (this.platform === 'kook') {
        // kook 无私信频道概念，兜底留个空字符串
        return session.guildId || ''
      }
    }
    return session.guildId
  }

  get channelId() {
    const session = this.session
    if (session.isDirect) {
      return session.channelId.split('_')[1]
    } else {
      return session.channelId
    }
  }

  get context(): IUserCommandContext {
    const session = this.session
    const substitute = this.substitute
    const realUser = this.realUser
    return {
      botId: this.botId,
      userId: substitute?.userId ?? realUser.userId,
      username: substitute?.username ?? realUser.username,
      userRole: convertRoleIds(session.author.roles),
      msgId: session.messageId,
      platform: this.platform,
      guildId: this.guildId,
      channelId: this.channelId,
      channelUnionId: getChannelUnionId(this.platform, this.guildId, this.channelId),
      replyMsgId: session.event.message?.quote?.id,
      isDirect: session.isDirect,
      realUser
    }
  }
  //
  // clone() {
  //   const newCommand = new UserCommand(this.bot, this.session, this.command, this.substitute)
  //   for (const key of Reflect.ownKeys(this)) {
  //     if (['session', 'command', 'substitute', 'bot'].includes(key as string)) continue
  //     newCommand[key] = this[key]
  //   }
  //   return newCommand
  // }

  static fromMessage(bot: Bot, session: Session) {
    try {
      // 无视非文本消息
      const elements = Element.transform(session.elements, ({ type, attrs }) => {
        if (type === 'at') {
          return true
        } else if (type === 'text') {
          return !!attrs.content.trim()
        } else {
          return false
        }
      }, session)
      if (elements.length === 0) throw new Error()

      // 提取出指令体，无视非指令消息
      const botUserId = bot.botInfo?.id
      let isInstruction = false
      // @机器人的消息
      if (botUserId && elements[0].type === 'at' && elements[0].attrs.id === botUserId) {
        isInstruction = true
        elements.splice(0, 1)
      }

      // 指令消息. 自定义回复建议使用 qq 频道原生指令前缀 “/”
      const firstElem = elements[0]
      if (firstElem && firstElem.type === 'text') {
        let firstSpan = firstElem.attrs.content.trimStart()
        if (firstSpan.startsWith('/') || firstSpan.startsWith('.') || firstSpan.startsWith('。')) {
          isInstruction = true
          firstSpan = firstSpan.substring(1)
          firstElem.attrs.content = firstSpan
        }
      }

      if (!isInstruction) throw new Error()

      // 是否是全局代骰
      let substitute: IUserCommandContext['realUser'] | undefined = undefined
      const lastElem = elements.at(-1)
      if (lastElem && lastElem.type === 'at') {
        const userId = lastElem.attrs.id
        const user = bot.guilds.findUser(userId, session.guildId) // 一般不会在私信用到，可以直接使用 session.guildId
        const username = user?.name ?? userId
        substitute = { userId, username }
        elements.splice(-1, 1)
      }

      const fullExp = elements.map(elem => elem.toString()).join('').trim()

      return new UserCommand(bot, session, fullExp, substitute)
    } catch (e) {
      return undefined
    }
  }

  static fromReaction(bot: Bot, session: Session) {
    return new UserCommand(bot, session, '', undefined)
  }
}

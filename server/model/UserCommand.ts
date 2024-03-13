import { Bot } from '../adapter/Bot'
import { Session } from '@satorijs/satori'
import { at, AtUserPatternEnd } from '../service/dice/utils'
import { IUserCommandContext, IUserCommand } from '../../interface/config'
import { BotId } from '../adapter/utils'
import { Platform } from '../../interface/platform/login'

export class UserCommand implements IUserCommand {

  readonly session: Session
  command: string
  readonly substitute: IUserCommandContext['realUser'] | undefined
  readonly botId: BotId
  readonly platform: Platform
  [key: string | number | symbol]: unknown

  private constructor(bot: Bot, session: Session, command: string, substitute: IUserCommandContext['realUser'] | undefined) {
    this.session = session
    this.command = command
    this.substitute = substitute
    this.botId = bot.id
    this.platform = bot.platform
  }

  get realUser() {
    const session = this.session
    return {
      userId: session.userId,
      username: session.author.name ?? session.userId
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
      userRole: 'admin', // todo convertRoleIds(msg.member.roles),
      msgId: session.messageId,
      platform: this.platform,
      guildId: session.guildId,
      channelId: session.channelId,
      replyMsgId: session.event.message?.quote?.id, //(msg as any).message_reference?.message_id,
      realUser
    }
  }

  static fromMessage(bot: Bot, session: Session) {
    try {
      // 无视非文本消息
      const content = session.content?.trim()
      if (!content) throw new Error()

      // 提取出指令体，无视非指令消息
      const botUserId = bot.botInfo?.id
      let fullExp = content // .d100 困难侦察
      let isInstruction = false
      // @机器人的消息
      if (botUserId && fullExp.startsWith(at(botUserId))) {
        isInstruction = true
        fullExp = fullExp.replace(at(botUserId), '').trim()
      }
      // 指令消息. 自定义回复建议使用 qq 频道原生指令前缀 “/”
      if (fullExp.startsWith('/') || fullExp.startsWith('.') || fullExp.startsWith('。')) {
        isInstruction = true
        fullExp = fullExp.substring(1).trim()
      }
      if (!isInstruction) throw new Error()

      // 是否是全局代骰
      let substitute: IUserCommandContext['realUser'] | undefined = undefined
      // if (config.config.parseRule.customReplySubstitute) {
      const userIdMatch = fullExp.match(AtUserPatternEnd)
      if (userIdMatch) {
        const subUserId = userIdMatch[1]
        const user = bot.guilds.findUser(subUserId, session.guildId)
        const subUsername = user?.name ?? subUserId
        fullExp = fullExp.substring(0, userIdMatch.index).trim()
        substitute = { userId: subUserId, username: subUsername }
      }
      // }

      // 转义 转义得放在 at 消息和 emoji 之类的后面
      // todo 是否需要
      // fullExp = unescapeHTML(fullExp)

      return new UserCommand(bot, session, fullExp, substitute)
    } catch (e) {
      return undefined
    }
  }

  static fromReaction(bot: Bot, session: Session) {
    return new UserCommand(bot, session, '', undefined)
  }
}

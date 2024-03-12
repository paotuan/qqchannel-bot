import { at, AtUserPatternEnd, convertRoleIds } from '../dice/utils'
import { unescapeHTML } from '../../utils'
import type { IUserCommandContext, ParseUserCommandResult } from '../../../interface/config'
import { Bot } from '../../adapter/Bot'
import { Session } from '@satorijs/satori'

// todo 改造成类，封装 session
// 统一处理用户的原始输入文字
export function parseUserCommand(bot: Bot, session: Session): ParseUserCommandResult | false {
  // 无视非文本消息
  const content = session.content?.trim()
  if (!content) return false

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
  if (!isInstruction) return false

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

  // 组装结构体
  const realUser = {
    userId: session.userId,
    username: session.author.name ?? session.userId
  }

  return {
    command: fullExp,
    context: {
      botId: bot.id,
      userId: substitute?.userId ?? realUser.userId,
      username: substitute?.username ?? realUser.username,
      userRole: 'admin', // todo convertRoleIds(msg.member.roles),
      msgId: session.messageId,
      platform: bot.platform,
      guildId: session.guildId,
      channelId: session.channelId,
      replyMsgId: session.event.message?.quote?.id, //(msg as any).message_reference?.message_id,
      realUser
    }
  }
}

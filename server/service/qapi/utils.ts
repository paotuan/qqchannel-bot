import type { QApi } from './index'
import type { IMessage as IQQMessage } from 'qq-guild-bot'
import { at, AtUserPatternEnd, convertRoleIds } from '../dice/utils'
import { unescapeHTML } from '../../utils'
import type { ParseUserCommandResult, ISubstituteUser } from '../../../interface/config'

// 统一处理用户的原始输入文字
export async function parseUserCommand(api: QApi, msg: IQQMessage): Promise<ParseUserCommandResult | false> {
  // 无视非文本消息
  const content = msg.content?.trim()
  if (!content) return false

  // 提取出指令体，无视非指令消息
  const botUserId = api.botInfo?.id
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
  let substitute: ISubstituteUser | undefined = undefined
  // if (config.config.parseRule.customReplySubstitute) {
  const userIdMatch = fullExp.match(AtUserPatternEnd)
  if (userIdMatch) {
    const subUserId = userIdMatch[1]
    const user = api.guilds.findUser(subUserId, msg.guild_id)
    const subUsername = user?.persona ?? subUserId
    fullExp = fullExp.substring(0, userIdMatch.index).trim()
    substitute = { userId: subUserId, username: subUsername }
  }
  // }

  // 转义 转义得放在 at 消息和 emoji 之类的后面
  fullExp = unescapeHTML(fullExp)

  // 组装结构体
  const result = {
    command: fullExp,
    message: {
      userId: msg.author.id,
      username: msg.member.nick || msg.author.username || msg.author.id,
      userRole: convertRoleIds(msg.member.roles),
      msgId: msg.id,
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      replyMsgId: (msg as any).message_reference?.message_id
    },
    substitute
  }

  const config = api.wss.config.getChannelConfig(result.message.channelId)

  // hook: OnReceiveCommandCallback 处理
  await config.hook_onReceiveCommand(result)

  // 整体别名指令处理
  result.command = config.parseAliasRoll_command(result.command)

  // 下一步处理
  return result
}

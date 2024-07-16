import type { Bot } from '../adapter/Bot'
import type { BotContext, ICommand } from '@paotuan/config'

/**
 * 处理用户手动设置 nick 相关操作
 * 此举是为了解决 qq 群无法获取用户昵称的问题
 * 其他平台还是建议优先使用平台昵称
 */
export class NickHandler {
  private readonly bot: Bot

  constructor(bot: Bot) {
    this.bot = bot
  }

  // 处理 .nick xxx 指令
  handleManualSetNickCommand(userCommand: ICommand<BotContext>): [boolean, string | undefined] {
    // 私信暂不考虑
    if (userCommand.context.isDirect) {
      return [false, undefined]
    }
    const expression = userCommand.command
    const { userId, guildId } = userCommand.context
    const user = this.bot.guilds.findUser(userId, guildId)

    if (expression.startsWith('nick') && user) {
      const content = expression.slice(4).trim()
      if (['x', 'clr', 'clear'].includes(content)) {
        // 清除昵称. 与 addUser 一致，名称默认取 id
        user.name = user.id
        return [true, '已清除昵称']
      } else if (content) {
        // 设置昵称
        user.name = content
        return [true, `已设置昵称为 ${content}`]
      }
      return [true, '请使用 .nick xxx 设置用户昵称']
    }
    return [false, undefined]
  }

  // 处理关联人物卡自动更新昵称
}

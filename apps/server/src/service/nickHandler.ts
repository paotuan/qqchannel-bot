import type { Bot } from '../adapter/Bot'
import type { BotContext, ICommand, ISpecialDiceConfig } from '@paotuan/config'
import { Events, ICardLinkChangeEvent } from '@paotuan/dicecore'
import { asChannelUnionId, splitChannelUnionId } from '../adapter/utils'

/**
 * 处理用户手动设置 nick 相关操作
 * 此举是为了解决 qq 群无法获取用户昵称的问题
 * 其他平台还是建议优先使用平台昵称
 */
export class NickHandler {
  private readonly bot: Bot

  constructor(bot: Bot) {
    this.bot = bot
    Events.on('card-link-change', e => this.handleCardLinkChangeUpdateNick(e))
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
  handleCardLinkChangeUpdateNick(event: ICardLinkChangeEvent) {
    const channelUnionId = asChannelUnionId(event.channelUnionId)
    if (!channelUnionId) return
    // 检查配置是否需要更新昵称
    const config = this.bot.wss.config.getChannelConfig(channelUnionId)
    const mode = config.specialDice.nnDice.updateNick
    if (mode === 'never') return
    const [platform, guildId, channelId] = splitChannelUnionId(channelUnionId)
    // 过滤非自己监听的频道
    if (platform !== this.bot.platform) return
    if (!this.bot.isListening(channelId, guildId)) return

    const { cardId, userId, oldCardId, oldUserId } = event
    if (userId) {
      this.handleUpdateNick(mode, { userId, guildId, cardId, oldCardId })
    }
    if (oldUserId) {
      this.handleUpdateNick(mode, {
        userId: oldUserId,
        guildId,
        cardId: undefined,
        oldCardId: cardId
      })
    }
  }

  private handleUpdateNick(mode: UpdateMode, { userId, guildId, cardId, oldCardId }: UpdateContext) {
    const user = this.bot.guilds.findUser(userId, guildId)
    if (!user) return
    const shouldUpdate = mode === 'always' // 始终更新
      || !user.name || (user.name === user.id) // 名称为空或等于 id，认为没有名字
      || (!!oldCardId && user.name === oldCardId) // 名字等于旧人物卡名，认为也是上次关联人物卡更新过来的，那么这次更换人物卡后，也同步更新名字
    if (shouldUpdate) {
      // 若取消关联了人物卡，就恢复成 id。我们不记用户原本的平台昵称（毕竟这一功能本身也只是为了解决没有昵称的问题）
      // 如果有平台昵称，那么用户下次发消息就会被更新掉
      user.name = cardId ? cardId : user.id
    }
  }
}

type UpdateMode = ISpecialDiceConfig['nnDice']['updateNick']
type UpdateContext = {
  userId: string
  guildId: string
  cardId: string | undefined
  oldCardId: string | undefined
}

import { makeAutoObservable } from 'mobx'
import type { IUserCommand } from '@paotuan/config'
import type { Bot } from '../../adapter/Bot'
import { ConfigProvider } from '@paotuan/dicecore'

export class CustomReplyManager {
  private readonly bot: Bot

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
  }

  async handleGuildMessage(userCommand: IUserCommand) {
    const { context, session } = userCommand
    const { guildId, channelId } = context
    const channel = this.bot.guilds.findChannel(channelId, guildId)
    if (!channel) return false

    const [handled, reply] = await ConfigProvider.getConfig(context.channelUnionId).handleCustomReply(userCommand)
    // 发消息
    if (reply) {
      channel.sendMessage(reply, session)
    }
    return handled
  }
}

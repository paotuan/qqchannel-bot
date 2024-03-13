import { makeAutoObservable } from 'mobx'
import Mustache from 'mustache'
import type {
  ICustomReplyConfig,
  ICustomReplyConfigItem,
  IUserCommand,
  IUserCommandContext
} from '../../../interface/config'
import { at, parseTemplate } from '../dice/utils'
import { ICustomReplyEnv } from '../../../interface/config'
import { VERSION_NAME } from '../../../interface/version'
import { DiceRollContext } from '../DiceRollContext'
import { getChannelUnionId } from '../../adapter/utils'
import { Bot } from '../../adapter/Bot'

export class CustomReplyManager {
  private readonly bot: Bot
  private get wss() { return this.bot.wss }

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
  }

  async handleGuildMessage({ command, context, session }: IUserCommand) {
    // 获取配置列表
    const { platform, guildId, channelId } = context
    const channelUnionId = getChannelUnionId(platform, guildId, channelId)
    const config = this.wss.config.getChannelConfig(channelUnionId)
    const channel = this.bot.guilds.findChannel(channelId, guildId)
    if (!channel) return false
    const processors = config.customReplyProcessors
    // 从上到下匹配
    for (const processor of processors) {
      const matchGroups = isMatch(processor, command)
      if (!matchGroups) continue
      const reply = await this.parseMessage(processor, matchGroups, context)
      // 发消息
      if (reply) {
        channel.sendMessage(reply, session)
      }
      return true
    }

    return false
  }

  private async parseMessage(processor: ICustomReplyConfig, matchGroups: Record<string, string>, context: IUserCommandContext) {
    try {
      if (!processor.items && !processor.handler) throw new Error('没有处理自定义回复的方法')
      const handler = processor.handler ?? randomReplyItem(processor.items!).reply
      // 替换模板
      const username = context.username
      const userId = context.userId
      const userRole = context.userRole
      const platform = context.platform
      const guildId = context.guildId
      const channelId = context.channelId
      const replyFunc = typeof handler === 'function' ? handler : ((env: ICustomReplyEnv, _matchGroup: Record<string, string>) => {
        return Mustache.render(handler, { ...env, ..._matchGroup }, undefined, { escape: value => value })
      })
      const channelUnionId = getChannelUnionId(platform, guildId, channelId)
      const getCard = (_userId: string) => this.wss.cards.getCard(channelUnionId, _userId)
      const env: ICustomReplyEnv = {
        botId: context.botId,
        platform: context.platform,
        channelId: context.channelId,
        guildId: context.guildId,
        userId,
        userRole,
        username,
        nick: username,
        用户名: username,
        人物卡名: getCard(userId)?.name ?? username,
        at: at(userId),
        at用户: at(userId),
        version: VERSION_NAME,
        realUser: context.realUser
      }
      const template = await replyFunc(env, matchGroups)
      // 替换 inline rolls
      return parseTemplate(template, new DiceRollContext(this.bot, { platform, guildId, channelId, userId, username, userRole }), [], 'message_template')
    } catch (e: any) {
      console.error('[Config] 自定义回复处理出错', e?.message)
      return undefined
    }
  }
}

// returns match groups
function isMatch(processor: ICustomReplyConfig, command: string): Record<string, string> | false {
  switch (processor.trigger) {
  case 'exact':
    return processor.command === command ? {} : false
  case 'startWith':
    return command.startsWith(processor.command) ? {} : false
  case 'include':
    return command.includes(processor.command) ? {} : false
  case 'regex': {
    const regex = new RegExp(processor.command) // 暂时没有缓存
    const match = command.match(regex)
    return match ? match.groups || {} : false
  }
  }
}

function randomReplyItem(items: ICustomReplyConfigItem[]) {
  if (items.length === 1) return items[0] // 大多数情况只有一条，直接返回
  // 根据权重计算. 权重目前只支持整数
  const totalWeight = items.map(item => item.weight).reduce((a, b) => a + b, 0)
  let randomWeight = Math.random() * totalWeight
  for (const item of items) {
    randomWeight -= item.weight
    if (randomWeight < 0) {
      return item
    }
  }
  // 理论不可能，除非权重填 0 了
  return items[items.length - 1]
}

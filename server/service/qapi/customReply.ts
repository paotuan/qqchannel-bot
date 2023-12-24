import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import type { IMessage } from 'qq-guild-bot'
import { render } from 'mustache'
import { unescapeHTML } from '../../utils'
import type { ICustomReplyConfig, ICustomReplyConfigItem } from '../../../interface/config'
import { at, AtUserPatternEnd, convertRoleIds, parseTemplate } from '../dice/utils'
import { ICustomReplyEnv } from '../../../interface/config'
import { VERSION_NAME } from '../../../interface/version'
import { DiceRollContext } from '../DiceRollContext'

export class CustomReplyManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }

  constructor(api: QApi) {
    makeAutoObservable<this, 'api' | 'wss'>(this, { api: false, wss: false })
    this.api = api
    // init listener
    this.api.onGuildMessage(async (data: any) => {
      switch (data.eventType) {
      case 'MESSAGE_CREATE':
        return await this.handleGuildMessage(data.msg as IMessage)
      case 'MESSAGE_DELETE':
      default:
        return false
      }
    })
  }

  private async handleGuildMessage(msg: IMessage) {
    // 无视非文本消息
    const content = msg.content?.trim()
    if (!content) return false

    // 提取出指令体，无视非指令消息
    const botUserId = this.api.botInfo?.id
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

    // 是否开启自定义回复代骰
    const config = this.wss.config.getChannelConfig(msg.channel_id)
    const substitute: { userId?: string, username?: string } = {}
    if (config.config.parseRule.customReplySubstitute) {
      const userIdMatch = fullExp.match(AtUserPatternEnd)
      if (userIdMatch) {
        substitute.userId = userIdMatch[1]
        const user = this.api.guilds.findUser(substitute.userId, msg.guild_id)
        substitute.username = user?.persona ?? substitute.userId
        fullExp = fullExp.substring(0, userIdMatch.index).trim()
      }
    }

    // 转义 转义得放在 at 消息和 emoji 之类的后面
    fullExp = unescapeHTML(fullExp)

    // 获取配置列表
    const channel = this.api.guilds.findChannel(msg.channel_id, msg.guild_id)
    if (!channel) return false
    const processors = config.customReplyProcessors
    // 从上到下匹配
    for (const processor of processors) {
      const matchGroups = isMatch(processor, fullExp)
      if (!matchGroups) continue
      const reply = await this.parseMessage(processor, matchGroups, msg, substitute)
      // 发消息
      if (reply) {
        channel.sendMessage({ content: reply, msg_id: msg.id })
      }
      return true
    }

    return false
  }

  private async parseMessage(processor: ICustomReplyConfig, matchGroups: Record<string, string>, msg: IMessage, substitute: { userId?: string, username?: string }) {
    try {
      if (!processor.items && !processor.handler) throw new Error('没有处理自定义回复的方法')
      const handler = processor.handler ?? randomReplyItem(processor.items!).reply
      // 替换模板
      const realUser = { userId: msg.author.id, username: msg.member.nick || msg.author.username || msg.author.id }
      const username = substitute.username ?? realUser.username
      const userId = substitute.userId ?? realUser.userId
      const channelId = msg.channel_id
      const replyFunc = typeof handler === 'function' ? handler : ((env: ICustomReplyEnv, _matchGroup: Record<string, string>) => {
        return render(handler, { ...env, ..._matchGroup }, undefined, { escape: value => value })
      })
      const userRole = convertRoleIds(msg.member.roles)
      const getCard = (_userId: string) => this.wss.cards.getCard(channelId, _userId)
      const env: ICustomReplyEnv = {
        botId: this.api.appid,
        channelId: msg.channel_id,
        guildId: msg.guild_id,
        userId,
        userRole,
        nick: username,
        用户名: username,
        人物卡名: getCard(userId)?.name ?? username,
        at: at(userId),
        at用户: at(userId),
        version: VERSION_NAME,
        realUser
      }
      const template = await replyFunc(env, matchGroups)
      // 替换 inline rolls
      return parseTemplate(template, new DiceRollContext(this.api, { channelId, userId, username, userRole }), [])
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

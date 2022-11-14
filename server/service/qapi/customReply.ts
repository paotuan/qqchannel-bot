import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import type { IMessage } from 'qq-guild-bot'
import { unescapeHTML } from '../../utils'
import type { ICustomReplyConfig, ICustomReplyConfigItem } from '../../../interface/config'
import { IDiceRollContext, parseTemplate, SuccessLevel } from '../dice/utils'

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
    if (fullExp.startsWith(`<@!${botUserId}>`)) {
      isInstruction = true
      fullExp = fullExp.replace(`<@!${botUserId}>`, '').trim()
    }
    // 指令消息. 自定义回复建议使用 qq 频道原生指令前缀 “/”
    if (fullExp.startsWith('/') || fullExp.startsWith('.') || fullExp.startsWith('。')) {
      isInstruction = true
      fullExp = fullExp.substring(1).trim()
    }
    if (!isInstruction) return false
    // 转义 转义得放在 at 消息和 emoji 之类的后面
    fullExp = unescapeHTML(fullExp)

    // 获取配置列表
    const channel = this.api.guilds.findChannel(msg.channel_id, msg.guild_id)
    if (!channel) return false
    const processors = channel.customReplyProcessors
    // 从上到下匹配
    for (const processor of processors) {
      const matchGroups = isMatch(processor, fullExp)
      if (!matchGroups) continue
      const reply = this.parseMessage(processor, matchGroups, msg)
      // 发消息
      channel.sendMessage({ content: reply, msg_id: msg.id })
      return true
    }

    return false
  }

  private parseMessage(processor: ICustomReplyConfig, matchGroups: Record<string, string>, msg: IMessage) {
    const item = randomReplyItem(processor.items)
    // 替换模板
    const username = msg.member.nick || msg.author.username || msg.author.id
    const userId = msg.author.id
    const channelId = msg.channel_id
    const replyFunc = item.replyFunc || ((env: Record<string, string>, _matchGroup: Record<string, string>) => {
      if (!item.reply) return ''
      return item.reply.replace(/\{\{\s*(.*)\s*\}\}/g, (_, key) => {
        if (_matchGroup[key]) {
          return _matchGroup[key]
        } else if (env[key]) {
          return env[key]
        } else {
          return key
        }
      })
    })
    const env: Record<string, string> = { nick: username, at: `<@!${msg.author.id}>` }
    const template = replyFunc(env, matchGroups)
    // 替换 inline rolls
    const card = channelId ? this.wss.cards.getCard(channelId, userId) : null
    const context: IDiceRollContext = {
      channelId,
      username,
      card,
      decide: () => ({ success: false, level: SuccessLevel.FAIL, desc: '' }) // 没用，随便写一个，后面可以统一到配置
    }
    return parseTemplate(template, context, [])
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
  // 根据权重计算. 权重放大 100 倍以支持小数
  const totalWeight = items.map(item => item.weight * 100).reduce((a, b) => a + b, 0)
  let randomWeight = Math.random() * totalWeight
  for (const item of items) {
    randomWeight -= item.weight * 100
    if (randomWeight < 0) {
      return item
    }
  }
  // 理论不可能，除非权重填 0 了
  return items[items.length - 1]
}

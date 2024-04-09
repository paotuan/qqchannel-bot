import { Wss } from '../app/wss'
import { Bot } from './Bot'
import { IBotConfig } from '@paotuan/types'
import { BotId, getBotId } from './utils'

export class BotManager {
  private readonly wss: Wss
  private readonly bots = new Map<BotId, Bot>()

  // singleton
  constructor(wss: Wss) {
    this.wss = wss
  }

  async login(config: IBotConfig) {
    const bot = this.find(getBotId(config.platform, config.appid))
    // 存在相同的连接，可直接复用
    if (bot && bot.sameConfigWith(config)) {
      console.log('已存在相同的机器人连接，可直接复用')
      return bot
    }
    // 存在不同的连接，移除旧的
    if (bot) {
      console.log('机器人连接配置变更，重新连接...')
      await bot.disconnect()
    }
    // 开启新连接
    const newBot = new Bot(config, this.wss)
    this.bots.set(newBot.id, newBot)
    await newBot.start()
    return newBot
  }

  find(id?: BotId): Bot | undefined {
    if (!id) {
      // 可做断言，理论不可能
      return undefined
    }
    return this.bots.get(id)
  }
}

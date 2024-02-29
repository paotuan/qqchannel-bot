import { Wss } from '../app/wss'
import { Bot } from './Bot'
import { makeAutoObservable } from 'mobx'
import { IBotConfig, Platform } from './types'

export class BotManager {
  private readonly wss: Wss
  private readonly bots: Record<string, Bot>  = {}

  // singleton
  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
  }

  async login(config: IBotConfig) {
    const bot = this.find(config.platform, config.appid)
    // 存在相同的连接，可直接复用
    if (bot && bot.equals(config)) {
      console.log('已存在相同的机器人连接，可直接复用')
      return
    }
    // 存在不同的连接，移除旧的
    if (bot) {
      console.log('机器人连接配置变更，重新连接...')
      await bot.disconnect()
    }
    // 开启新连接
    const newBot = new Bot(config)
    await newBot.start()
  }

  find(platform: Platform, appid: string): Bot | undefined {
    const key = `${platform}:${appid}`
    return this.bots[key]
  }
}

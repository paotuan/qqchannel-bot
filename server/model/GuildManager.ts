import type { Bot } from '../adapter/Bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Guild } from './Guild'

export class GuildManager {
  private readonly bot: Bot
  private guildsMap: Record<string, Guild> = {}

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
    this.fetchGuilds()
  }

  get all() {
    return Object.values(this.guildsMap)
  }

  // 请求所有 guild
  private async fetchGuilds() {
    this.guildsMap = {}
    try {
      const resp = await this.bot.api.getGuildList()
      const list = resp.data.slice(0, 10) // QQ 私域应该最多能加入 10 个频道，暂不考虑分页
      runInAction(() => {
        const guilds = list.map(info => new Guild(this.bot, info.id, info.name, info.avatar))
        this.guildsMap = guilds.reduce((obj, guild) => Object.assign(obj, { [guild.id]: guild }), {})
      })
    } catch (e) {
      console.error('获取频道信息失败', e)
    }
  }

  private initEventListeners() {
    // todo
  }
}

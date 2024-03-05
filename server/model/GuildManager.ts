import type { Bot } from '../adapter/Bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Guild } from './Guild'
import { Universal } from '@satorijs/satori'
import { Channel } from './Channel'

export class GuildManager {
  private readonly bot: Bot
  private guildsMap: Record<string, Guild> = {}

  constructor(bot: Bot) {
    makeAutoObservable(this)
    this.bot = bot
    this.fetchGuilds()
    this.initEventListeners()
  }

  get all() {
    return Object.values(this.guildsMap)
  }

  find(guildId: string): Guild | undefined {
    return this.guildsMap[guildId]
  }

  findUser(userId: string, guildId: string) {
    const guild = this.find(guildId)
    if (!guild) {
      console.error('[GuildManager]频道信息不存在，guildId=', guildId, 'userId=', userId)
      return undefined
    }
    return guild.findUser(userId)
  }

  findChannel(channelId: string, guildId: string) {
    const guild = this.find(guildId)
    if (!guild) {
      console.error('[GuildManager]频道信息不存在，guildId=', guildId, 'channelId=', channelId)
      return undefined
    }
    const channel = guild.findChannel(channelId)
    if (!channel) {
      console.error('[GuildManager]子频道信息不存在，guildId=', guildId, 'channelId=', channelId)
      return undefined
    }
    return channel
  }

  // 处理获取 guild/channel 接口有时失败的问题，理论上我们只需要 guildId、channelId，可以和 user 一样直接从 message 里面取
  addGuildChannelByMessage(_guild?: Universal.Guild, _channel?: Universal.Channel) {
    if (!_guild || !_channel) return
    // 不处理私信消息
    if (_channel.type === Universal.Channel.Type.DIRECT) return
    const guildId = _guild.id
    const channelId = _channel.id
    let guild = this.guildsMap[guildId]
    if (!guild) {
      console.log('Create guild by message, id =', guildId)
      this.addGuild({ id: guildId, name: guildId, icon: '' })
      guild = this.guildsMap[guildId]
    }
    const channel = guild.findChannel(channelId)
    if (!channel) {
      console.log('Create channel by message, id =', channelId)
      // 现在 satori 类型适配不全。如果能收到消息说明总归是 valid 的类型，兜底按文字子频道处理也没什么问题
      const type = Channel.VALID_TYPES.includes(_channel.type) ? _channel.type : Universal.Channel.Type.TEXT
      guild.addChannel({ id: channelId, name: channelId, type })
    }
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

  private addGuild({ id, name, icon }: { id: string, name: string, icon: string }) {
    this.guildsMap[id] = new Guild(this.bot, id, name, icon)
  }

  // private updateGuild({ id, name, icon }: { id: string, name: string, icon: string }) {
  //   if (this.guildsMap[id]) {
  //     this.guildsMap[id].name = name
  //     this.guildsMap[id].icon = icon
  //   }
  // }
  //
  // private deleteGuild(id: string) {
  //   delete this.guildsMap[id]
  // }

  private initEventListeners() {
    // todo guild 和 channel 变动事件，satori 不全，而且使用场景少，暂不处理。目前也可以通过发消息进行更新
    // todo guild member 事件也同理。后续实验下各平台的真实数据再进行处理
  }
}

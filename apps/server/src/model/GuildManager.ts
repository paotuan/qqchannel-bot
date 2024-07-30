import { Guild, IUserQuery } from './Guild'
import type { Bot } from '../adapter/Bot'
import { Universal } from '../adapter/satori'
import { Channel } from './Channel'
import { User } from './User'
import type { IChannel, IChannelListResp } from '@paotuan/types'

export class GuildManager {
  private readonly bot: Bot
  private guildsMap: Record<string, Guild> = {}

  constructor(bot: Bot) {
    this.bot = bot
    if (bot.platform !== 'qq') {
      this.fetchGuilds()
      this.initEventListeners()
    }
  }

  find(guildId: string): Guild | undefined {
    return this.guildsMap[guildId]
  }

  findUser(userId: string, guildId: string) {
    const guild = this.find(guildId)
    if (!guild) {
      if (this.bot.platform === 'kook') {
        // kook 用户无频道概念，因此 guildId 为空（私信场景）时，可以返回一个 temp user，不影响发消息
        return User.createTemp(this.bot, userId, guildId)
      } else {
        console.error('[GuildManager]频道信息不存在，guildId=', guildId, 'userId=', userId)
        return undefined
      }
    }
    return guild.findUser(userId)
  }

  queryUser(query: IUserQuery, guildId: string) {
    const guild = this.find(guildId)
    if (!guild) return []
    return guild.queryUser(query)
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
    const guildId = _guild.id
    const channelId = _channel.id
    let guild = this.guildsMap[guildId]
    if (!guild) {
      console.log('Create guild by message, id =', guildId)
      this.addGuild({ id: guildId, name: _guild.name ?? guildId, icon: _guild?.avatar ?? '' })
      guild = this.guildsMap[guildId]
    }
    const channel = guild.findChannel(channelId)
    if (!channel) {
      console.log('Create channel by message, id =', channelId)
      // 现在 satori 类型适配不全。如果能收到消息说明总归是 valid 的类型，兜底按文字子频道处理也没什么问题
      const type = Channel.VALID_TYPES.includes(_channel.type) ? _channel.type : Universal.Channel.Type.TEXT
      guild.addChannel({ id: channelId, name: _channel.name ?? channelId, type })
    }
  }

  addOrUpdateUserByMessage(_guild?: Universal.Guild, _author?: Universal.GuildMember & Universal.User) {
    if (!_guild || !_author) return
    // qq 群获取头像特殊处理
    if (this.bot.platform === 'qq' && !_author.avatar) {
      _author.avatar = `https://q.qlogo.cn/qqapp/${this.bot.appid}/${_author.id}/100`
    }
    this.addOrUpdateUser(_author, _guild.id)
  }

  // 请求所有 guild
  private async fetchGuilds() {
    this.guildsMap = {}
    try {
      const resp = await this.bot.api.getGuildList()
      const list = resp.data.slice(0, 10) // QQ 私域应该最多能加入 10 个频道，暂不考虑分页
      const guilds = list.map(info => new Guild(this.bot, info.id, info.name, info.avatar))
      this.guildsMap = guilds.reduce((obj, guild) => Object.assign(obj, { [guild.id]: guild }), {})
      this.notifyChannelListChange()
    } catch (e) {
      console.error('获取频道信息失败', e)
    }
  }

  private addGuild({ id, name, icon }: { id: string, name: string, icon: string }) {
    this.guildsMap[id] = new Guild(this.bot, id, name, icon)
    this.notifyChannelListChange()
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
  //
  // addChannel(channel: IChannel) {
  //   if (!Channel.VALID_TYPES.includes(channel.type)) return // 不支持的子频道类型
  //   const guild = this.guildsMap[channel.guild_id]
  //   if (guild) {
  //     guild.addChannel(channel)
  //   }
  // }
  //
  // updateChannel(channel: IChannel) {
  //   if (!Channel.VALID_TYPES.includes(channel.type)) return // 不支持的子频道类型
  //   const guild = this.guildsMap[channel.guild_id]
  //   if (guild) {
  //     guild.updateChannel(channel)
  //   }
  // }
  //
  // deleteChannel(channel: IChannel) {
  //   if (!Channel.VALID_TYPES.includes(channel.type)) return // 不支持的子频道类型
  //   const guild = this.guildsMap[channel.guild_id]
  //   if (guild) {
  //     guild.deleteChannel(channel.id)
  //   }
  // }

  private addOrUpdateUser(author: Universal.GuildMember & Universal.User, guildId: string) {
    const guild = this.guildsMap[guildId]
    if (guild) {
      guild.addOrUpdateUser(author)
    }
  }

  private deleteUser(userId: string, guildId: string) {
    const guild = this.guildsMap[guildId]
    if (guild) {
      guild.deleteUser(userId)
    }
  }

  private initEventListeners() {
    // todo guild 和 channel 变动事件，satori 不全，而且使用场景少，暂不处理。目前也可以通过发消息进行更新
    // 监听成员变动事件
    this.bot.on('guild-member-added', session => this.addOrUpdateUser(session.author, session.guildId))
    this.bot.on('guild-member-updated', session => this.addOrUpdateUser(session.author, session.guildId))
    this.bot.on('guild-member-removed', session => this.deleteUser(session.userId, session.guildId))
  }

  // channel list 更新通知客户端
  notifyChannelListChange() {
    const guilds = Object.values(this.guildsMap)
    const channels: IChannel[] = guilds.map(guild => guild.allChannels.map(channel => ({
      id: channel.id,
      name: channel.name,
      type: channel.type,
      guildId: channel.guildId,
      guildName: guild.name,
      guildIcon: guild.icon
    }))).flat()
    this.bot.sendToClient<IChannelListResp>({ cmd: 'channel/list', success: true, data: channels })
  }
}

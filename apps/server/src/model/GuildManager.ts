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
  }

  init() {
    // qq 群场景不支持
    // onebot 场景，目前 gsk 的实现不支持，且可能存在协议有关的 id 问题（见 Guild#constructor），保险起见暂时屏蔽之
    if (this.bot.platform !== 'qq' && this.bot.platform !== 'onebot') {
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
      // 对大多数平台来说，用户没有频道的概念
      // (注：qq 频道有。qq 群号称用户 openid 与群有关，但实际无关，发消息走的是好友而非群临时会话)
      // 因此 guildId 为空（私信场景）时，可以返回一个 temp user，通常不影响发消息
      return User.createTemp(this.bot, userId, guildId)
    }
    return guild.findUser(userId)
  }

  // 对于没有 guildId 的场景（私信等）在所有频道中寻找该用户
  // 考虑到 bot 已经限制了同一个 platform，大概率不会出现不同用户撞 id 的情况
  // 不过可能出现一个 user 有多个对象（例如一个机器人加入了 n 个群）
  findUserInAllGuilds(userId: string) {
    const ret: User[] = []
    Object.values(this.guildsMap).forEach(guild => {
      if (guild.existUser(userId)) {
        ret.push(guild.findUser(userId))
      }
    })
    return ret
  }

  queryIUser(query: IUserQuery, guildId: string) {
    const guild = this.find(guildId)
    if (!guild) return []
    return guild.queryIUser(query)
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

  // qq 群快捷登录逻辑，此时后端还未生成 guild 和 channel 对象
  // 大部分时候这不是问题，因为之后在群里发送一条消息就会自动创建出来
  // 但极端情况：例如快捷登录群后，只进行私聊，而私聊又会用到 guild 的信息（查找兜底昵称）
  // 为此我们在登录时就把 guild 和 channel 创建出来
  addGuildChannelByAutoLogin(guildId: string, channelId: string) {
    let guild = this.guildsMap[guildId]
    if (!guild) {
      console.log('Create guild by auto login, id =', guildId)
      this.addGuild({ id: guildId, name: guildId, icon: '' })
      guild = this.guildsMap[guildId]
    }
    const channel = guild.findChannel(channelId)
    if (!channel) {
      console.log('Create channel by auto login, id =', channelId)
      guild.addChannel({ id: channelId, name: channelId, type: Universal.Channel.Type.TEXT })
    }
  }

  addOrUpdateUserByMessage(_guild?: Universal.Guild, _author?: Universal.GuildMember & Universal.User) {
    if (!_guild || !_author) return
    // qq 群获取头像特殊处理
    if (this.bot.platform === 'qq' && !_author.avatar) {
      _author.avatar = `https://q.qlogo.cn/qqapp/${this.bot.appid}/${_author.id}/100`
    }
    console.log('addOrUpdateUserByMessage', _author, _guild.id)
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
      // 若 guild 拉取成功但数量为 0，给个提示以避免有些用户不看前端的提示
      if (list.length === 0) {
        console.warn('[GuildManager]获取频道数量为 0，请确认机器人是否已加入到频道中！')
      }
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
    console.log('notify channels', channels, new Error())
    this.bot.sendToClient<IChannelListResp>({ cmd: 'channel/list', success: true, data: channels })
  }
}

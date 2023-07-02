import type { QApi } from './index'
import { AvailableIntentsEventsEnum, IChannel, IMember, IMessage } from 'qq-guild-bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Channel } from './channel'
import { User } from './user'

/**
 * 频道实例，一个机器人可以被加入多个频道
 */
export class Guild {
  readonly id: string
  name: string
  icon: string
  private channelsMap: Record<string, Channel> = {}
  private usersMap: Record<string, User> = {}
  private readonly api: QApi

  get allChannels() {
    return Object.values(this.channelsMap)
  }

  // get allUsers() {
  //   return Object.values(this.usersMap)
  // }

  constructor(api: QApi, id: string, name: string, icon: string) {
    makeAutoObservable<this, 'api'>(this, { id: false, api: false })
    this.api = api
    this.id = id
    this.name = name
    this.icon = icon
    this.fetchChannels(api)
    // this.fetchUsers(api)
  }

  async fetchChannels(api: QApi) {
    this.channelsMap = {}
    try {
      const { data } = await api.qqClient.channelApi.channels(this.id)
      runInAction(() => {
        const channels = data
          .filter(channel => Channel.VALID_TYPES.includes(channel.type))
          .map(channel => new Channel(this.api, channel.id, this.id, channel.name, channel.type))
        this.channelsMap = channels.reduce((obj, chan) => Object.assign(obj, { [chan.id]: chan }), {})
      })
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }

  // async fetchUsers(api: QApi) {
  //   this.usersMap = {}
  //   try {
  //     const data = await this._fetchUsersInner(api)
  //     runInAction(() => {
  //       const users = data.map(item => new User(this.api, item, this.id))
  //       this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
  //     })
  //   } catch (e) {
  //     console.error('获取频道用户信息失败', e)
  //   }
  // }

  // 分页获取全部用户列表
  // async _fetchUsersInner(api: QApi) {
  //   const allUserList: IMember[] = []
  //   // eslint-disable-next-line no-constant-condition
  //   while (true) {
  //     const lastUserId = allUserList.length === 0 ? '0' : allUserList[allUserList.length - 1].user.id
  //     const { data } = await api.qqClient.guildApi.guildMembers(this.id, { limit: 400, after: lastUserId })
  //     console.log('获取用户列表，count = ', data.length)
  //     if (data.length === 0) {
  //       break
  //     }
  //     allUserList.push(...data)
  //   }
  //   return allUserList
  // }

  addChannel(channel: IChannel) {
    this.channelsMap[channel.id] = new Channel(this.api, channel.id, this.id, channel.name, channel.type)
  }

  updateChannel(channel: IChannel) {
    const chan = this.channelsMap[channel.id]
    if (chan) {
      chan.name = channel.name
    }
  }

  deleteChannel(id: string) {
    delete this.channelsMap[id]
  }

  addOrUpdateUser(member: IMember) {
    const user = this.usersMap[member.user.id]
    if (user) {
      user.nick = member.nick ?? user.nick
      user.username = member.user.username ?? user.username
      user.avatar = member.user.avatar ?? user.avatar
      user.deleted = false
    } else {
      const newUser = new User(this.api, member, this.id)
      this.usersMap[newUser.id] = newUser
    }
  }

  deleteUser(id: string) {
    const user = this.usersMap[id]
    if (user) {
      user.deleted = true
    }
  }

  findUser(id: string) {
    return this.usersMap[id] ?? User.createTemp(this.api, id, this.id)
  }

  findChannel(id: string): Channel | undefined {
    return this.channelsMap[id]
  }
}

/**
 * 管理机器人所在的所有频道，维护频道和频道成员的信息
 */
export class GuildManager {
  private readonly api: QApi
  private guildsMap: Record<string, Guild> = {}

  get all() {
    return Object.values(this.guildsMap)
  }

  constructor(api: QApi) {
    makeAutoObservable<this, 'api'>(this, { api: false })
    this.api = api
    this.fetchGuilds().then(() => {
      this.initEventListeners()
    })
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

  async fetchGuilds() {
    this.guildsMap = {}
    try {
      const resp = await this.api.qqClient.meApi.meGuilds({ limit: 10 }) // 私域应该最多能加入 10 个频道
      runInAction(() => {
        const guilds = resp.data.map(info => new Guild(this.api, info.id, info.name, info.icon))
        this.guildsMap = guilds.reduce((obj, guild) => Object.assign(obj, { [guild.id]: guild }), {})
      })
    } catch (e) {
      console.error('获取频道信息失败', e)
    }
  }

  addGuild({ id, name, icon }: { id: string, name: string, icon: string }) {
    this.guildsMap[id] = new Guild(this.api, id, name, icon)
  }

  updateGuild({ id, name, icon }: { id: string, name: string, icon: string }) {
    if (this.guildsMap[id]) {
      this.guildsMap[id].name = name
      this.guildsMap[id].icon = icon
    }
  }

  deleteGuild(id: string) {
    delete this.guildsMap[id]
  }

  addChannel(channel: IChannel) {
    if (!Channel.VALID_TYPES.includes(channel.type)) return // 不支持的子频道类型
    const guild = this.guildsMap[channel.guild_id]
    if (guild) {
      guild.addChannel(channel)
    }
  }

  updateChannel(channel: IChannel) {
    if (!Channel.VALID_TYPES.includes(channel.type)) return // 不支持的子频道类型
    const guild = this.guildsMap[channel.guild_id]
    if (guild) {
      guild.updateChannel(channel)
    }
  }

  deleteChannel(channel: IChannel) {
    if (!Channel.VALID_TYPES.includes(channel.type)) return // 不支持的子频道类型
    const guild = this.guildsMap[channel.guild_id]
    if (guild) {
      guild.deleteChannel(channel.id)
    }
  }

  addOrUpdateUser(member: IMember) {
    console.log('[GuildManager] addOrUpdateUser', member)
    const guild = this.guildsMap[member.guild_id]
    if (guild) {
      guild.addOrUpdateUser(member)
    }
  }

  addOrUpdateUserByMessage(message: IMessage) {
    // message 返回的格式和实际签名不太符合，要做点兼容处理
    const member: IMember = {
      ...message.member,
      // 注意私信没有 nick 和 roles
      user: message.author,
      guild_id: (message as any).direct_message ? (message as any).src_guild_id : message.guild_id // 私信取 src_guild_id
    }
    this.addOrUpdateUser(member)
  }

  deleteUser(member: IMember) {
    const guild = this.guildsMap[member.guild_id]
    if (guild) {
      guild.deleteUser(member.user.id)
    }
  }

  private initEventListeners() {
    this.api.on(AvailableIntentsEventsEnum.GUILDS, (data: any) => {
      console.log(`[QApi][频道事件][${data.eventType}]`, data.msg)
      switch (data.eventType) {
      case 'GUILD_CREATE':
        this.addGuild(data.msg)
        break
      case 'GUILD_UPDATE':
        this.updateGuild(data.msg)
        break
      case 'GUILD_DELETE':
        this.deleteGuild(data.msg.id)
        break
      case 'CHANNEL_CREATE':
        this.addChannel(data.msg)
        break
      case 'CHANNEL_UPDATE':
        this.updateChannel(data.msg)
        break
      case 'CHANNEL_DELETE':
        this.deleteChannel(data.msg)
        break
      default:
        break
      }
    })
    this.api.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, (data: any) => {
      console.log(`[QApi][频道成员事件][${data.eventType}]`, data.msg)
      switch (data.eventType) {
      case 'GUILD_MEMBER_ADD':
      case 'GUILD_MEMBER_UPDATE':
        this.addOrUpdateUser(data.msg)
        break
      case 'GUILD_MEMBER_REMOVE':
        this.deleteUser(data.msg)
        break
      default:
        break
      }
    })
  }
}

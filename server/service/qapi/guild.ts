import type { QApi } from './index'
import { AvailableIntentsEventsEnum, IChannel, IMember } from 'qq-guild-bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Channel } from './channel'
import { User } from './user'

/**
 * 频道实例，一个机器人可以被加入多个频道
 */
export class Guild {
  readonly id: string
  name: string
  private channelsMap: Record<string, Channel> = {}
  private usersMap: Record<string, User> = {}
  private readonly api: QApi

  get allChannels() {
    return Object.values(this.channelsMap)
  }

  get allUsers() {
    return Object.values(this.usersMap)
  }

  constructor(api: QApi, id: string, name: string) {
    makeAutoObservable<this, 'api'>(this, { id: false, api: false })
    this.api = api
    this.id = id
    this.name = name
    this.fetchChannels(api)
    this.fetchUsers(api)
  }

  async fetchChannels(api: QApi) {
    this.channelsMap = {}
    try {
      const { data } = await api.qqClient.channelApi.channels(this.id)
      runInAction(() => {
        const channels = data
          .filter(channel => channel.type === Channel.TYPE_TEXT)
          .map(channel => new Channel(this.api, channel.id, this.id, channel.name))
        this.channelsMap = channels.reduce((obj, chan) => Object.assign(obj, { [chan.id]: chan }), {})
      })
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }

  async fetchUsers(api: QApi) {
    this.usersMap = {}
    try {
      const data = await this._fetchUsersInner(api)
      runInAction(() => {
        const users = data.map(item => new User(this.api, item, this.id))
        this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
      })
    } catch (e) {
      console.error('获取频道用户信息失败', e)
    }
  }

  // 分页获取全部用户列表
  async _fetchUsersInner(api: QApi) {
    const allUserList: IMember[] = []
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const lastUserId = allUserList.length === 0 ? '0' : allUserList[allUserList.length - 1].user.id
      const { data } = await api.qqClient.guildApi.guildMembers(this.id, { limit: 1000, after: lastUserId })
      console.log('获取用户列表，count = ', data.length)
      if (data.length === 0) {
        break
      }
      allUserList.push(...data)
    }
    return allUserList
  }

  addChannel(channel: IChannel) {
    this.channelsMap[channel.id] = new Channel(this.api, channel.id, this.id, channel.name)
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

  addUser(member: IMember) {
    const user = new User(this.api, member, this.id)
    this.usersMap[user.id] = user
  }

  updateUser(member: IMember) {
    const user = this.usersMap[member.user.id]
    if (user) {
      user.nick = member.nick
      user.username = member.user.username
      user.avatar = member.user.avatar
    }
  }

  deleteUser(id: string) {
    const user = this.usersMap[id]
    if (user) {
      user.deleted = true
    }
  }

  findUser(id: string) {
    return this.usersMap[id]
  }

  findChannel(id: string) {
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

  find(guildId: string) {
    return this.guildsMap[guildId]
  }

  findUser(userId: string, guildId?: string) {
    const guild = guildId ? this.find(guildId) : null
    if (guild) {
      return guild.findUser(userId)
    } else {
      for (const guild of this.all) {
        const user = guild.findUser(userId)
        if (user) return user
      }
    }
  }

  findChannel(channelId: string, guildId?: string) {
    const guild = guildId ? this.find(guildId) : null
    if (guild) {
      return guild.findChannel(channelId)
    } else {
      for (const guild of this.all) {
        const channel = guild.findChannel(channelId)
        if (channel) return channel
      }
    }
  }

  async fetchGuilds() {
    this.guildsMap = {}
    try {
      const resp = await this.api.qqClient.meApi.meGuilds({ limit: 1 }) // 先只拉一个
      runInAction(() => {
        const guilds = resp.data.map(info => new Guild(this.api, info.id, info.name))
        this.guildsMap = guilds.reduce((obj, guild) => Object.assign(obj, { [guild.id]: guild }), {})
      })
    } catch (e) {
      console.error('获取频道信息失败', e)
    }
  }

  addGuild({ id, name }: { id: string, name: string }) {
    this.guildsMap[id] = new Guild(this.api, id, name)
  }

  updateGuild({ id, name }: { id: string, name: string }) {
    if (this.guildsMap[id]) {
      this.guildsMap[id].name = name
    }
  }

  deleteGuild(id: string) {
    delete this.guildsMap[id]
  }

  addChannel(channel: IChannel) {
    if (channel.type !== Channel.TYPE_TEXT) return // 只支持文字子频道
    const guild = this.guildsMap[channel.guild_id]
    if (guild) {
      guild.addChannel(channel)
    }
  }

  updateChannel(channel: IChannel) {
    if (channel.type !== Channel.TYPE_TEXT) return // 只支持文字子频道
    const guild = this.guildsMap[channel.guild_id]
    if (guild) {
      guild.updateChannel(channel)
    }
  }

  deleteChannel(channel: IChannel) {
    if (channel.type !== Channel.TYPE_TEXT) return // 只支持文字子频道
    const guild = this.guildsMap[channel.guild_id]
    if (guild) {
      guild.deleteChannel(channel.id)
    }
  }

  addUser(member: IMember) {
    const guild = this.guildsMap[member.guild_id]
    if (guild) {
      guild.addUser(member)
    }
  }

  updateUser(member: IMember) {
    const guild = this.guildsMap[member.guild_id]
    if (guild) {
      guild.updateUser(member)
    }
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
        this.addUser(data.msg)
        break
      case 'GUILD_MEMBER_UPDATE':
        this.updateUser(data.msg)
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

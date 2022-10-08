import type { QApi } from './index'
import { AvailableIntentsEventsEnum, IChannel, IMember } from 'qq-guild-bot'
import { makeAutoObservable } from 'mobx'

export class Guild {
  readonly id: string
  name: string
  private channelsMap: Record<string, Channel> = {}
  private usersMap: Record<string, User> = {}

  get allChannels() {
    return Object.values(this.channelsMap)
  }

  get allUsers() {
    return Object.values(this.usersMap)
  }

  constructor(api: QApi, id: string, name: string) {
    makeAutoObservable(this, { id: false })
    this.id = id
    this.name = name
    this.fetchChannels(api)
    this.fetchUsers(api)
  }

  async fetchChannels(api: QApi) {
    this.channelsMap = {}
    try {
      const { data } = await api.qqClient.channelApi.channels(this.id)
      const channels = data
        .filter(channel => channel.type === Channel.TYPE_TEXT)
        .map(channel => new Channel(channel.id, this.id, channel.name))
      this.channelsMap = channels.reduce((obj, chan) => Object.assign(obj, { [chan.id]: chan }), {})
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }

  async fetchUsers(api: QApi) {
    this.usersMap = {}
    try {
      const { data } = await api.qqClient.guildApi.guildMembers(this.id, { limit: 1000, after: '0' })
      const users = data.map(item => new User(item))
      this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
    } catch (e) {
      console.error('获取频道用户信息失败', e)
    }
  }

  addChannel(channel: IChannel) {
    this.channelsMap[channel.id] = new Channel(channel.id, this.id, channel.name)
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
    const user = new User(member)
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
}

export class Channel {
  static TYPE_TEXT = 0
  readonly id: string
  readonly guildId: string
  name: string

  constructor(id: string, guildId: string, name: string) {
    makeAutoObservable(this, { id: false, guildId: false })
    this.id = id
    this.guildId = guildId
    this.name = name
  }
}

export class User {
  readonly id: string
  readonly guildId: string
  nick: string
  username: string
  avatar: string
  readonly bot: boolean
  deleted = false // user 退出不能删除，只标记为 delete，因为其他地方可能还需要 user 的相关信息

  constructor(member: IMember) {
    makeAutoObservable(this, { id: false, guildId: false })
    this.id = member.user.id
    this.guildId = member.guild_id
    this.nick = member.nick
    this.username = member.user.username
    this.avatar = member.user.avatar
    this.bot = member.user.bot
  }
}

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

  async fetchGuilds() {
    this.guildsMap = {}
    try {
      const resp = await this.api.qqClient.meApi.meGuilds({ limit: 1 }) // 先只拉一个
      const guilds = resp.data.map(info => new Guild(this.api, info.id, info.name))
      this.guildsMap = guilds.reduce((obj, guild) => Object.assign(obj, { [guild.id]: guild }), {})
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
    this.api.qqWs.on(AvailableIntentsEventsEnum.GUILDS, (data: any) => {
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
        console.warn(`unknown eventType ${data.eventType} in GUILDS events`)
        break
      }
    })
    this.api.qqWs.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, (data: any) => {
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
        console.warn(`unknown eventType ${data.eventType} in GUILD_MEMBERS events`)
        break
      }
    })
  }
}

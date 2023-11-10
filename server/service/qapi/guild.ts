import type { QApi } from './index'
import { AvailableIntentsEventsEnum, IChannel, IMember, IMessage } from 'qq-guild-bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Channel } from './channel'
import { User } from './user'
import * as fs from 'fs'
import { VERSION_CODE } from '../../../interface/version'

const USER_DIR = './user'

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

  get allUsers() {
    return Object.values(this.usersMap)
  }

  constructor(api: QApi, id: string, name: string, icon: string) {
    makeAutoObservable<this, 'api'>(this, { id: false, api: false })
    this.api = api
    this.id = id
    this.name = name
    this.icon = icon
    this.fetchChannels(api)
    // this.fetchUsers(api)
    this.loadUsers()
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
      // 判断是否有更新需要持久化
      let updated = false
      if (member.nick && member.nick !== user.nick) {
        user.nick = member.nick
        updated = true
      }
      if (member.user.username && member.user.username !== user.username) {
        user.username = member.user.username
        updated = true
      }
      if (member.user.avatar && member.user.avatar !== user.avatar) {
        user.avatar = member.user.avatar
        updated = true
      }
      if (user.deleted) {
        user.deleted = false
        updated = true
      }
      if (updated) {
        this.saveUsers()
      }
    } else {
      const newUser = new User(this.api, member, this.id)
      this.usersMap[newUser.id] = newUser
      this.saveUsers()
    }
  }

  deleteUser(id: string) {
    const user = this.usersMap[id]
    if (user && !user.deleted) {
      user.deleted = true
      this.saveUsers()
    }
  }

  deleteUsersBatch(ids: string[]) {
    let updated = false
    ids.forEach(id => {
      const user = this.usersMap[id]
      if (user && !user.deleted) {
        user.deleted = true
        updated = true
      }
    })
    if (updated) {
      this.saveUsers()
    }
  }

  findUser(id: string) {
    return this.usersMap[id] ?? User.createTemp(this.api, id, this.id)
  }

  findChannel(id: string): Channel | undefined {
    return this.channelsMap[id]
  }

  // user 表持久化
  private saveUsers() {
    const allUsersOfGuild = Object.values(this.usersMap).map(user => user.toJSON)
    console.log('[Guild] 保存用户列表，count=', allUsersOfGuild.length)
    const data = { version: VERSION_CODE, list: allUsersOfGuild }
    if (!fs.existsSync(USER_DIR)) {
      fs.mkdirSync(USER_DIR)
    }
    fs.writeFile(`${USER_DIR}/${this.id}.json`, JSON.stringify(data), (e) => {
      if (e) {
        console.error('[Guild] 保存用户列表失败', e)
      }
    })
  }

  private loadUsers() {
    console.log('[Guild] 开始读取用户，guildId=', this.id)
    const filename = `${USER_DIR}/${this.id}.json`
    if (!fs.existsSync(filename)) return
    try {
      const str = fs.readFileSync(filename, 'utf8')
      const { version, list } = JSON.parse(str) as { version: number, list: User['toJSON'][] }
      const users = list.map(data => User.fromJSON(this.api, data))
      this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
      // 一次性传给前端吧
    } catch (e) {
      console.error(`[Guild] ${filename} 用户列表解析失败`, e)
    }
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
    // todo 理论上不需要请求成功后再 init listener。不过这些 listener 一般也很少触发，问题不大
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

  // 处理获取 guild/channel 接口有时失败的问题，理论上我们只需要 guildId、channelId，可以和 user 一样直接从 message 里面取
  addGuildChannelByMessage(message: IMessage) {
    // 不处理私信消息
    if ((message as any).direct_message) return
    const guildId = message.guild_id
    const channelId = message.channel_id
    let guild = this.guildsMap[guildId]
    if (!guild) {
      console.log('Create guild by message, id =', guildId)
      this.addGuild({ id: guildId, name: guildId, icon: '' })
      guild = this.guildsMap[guildId]
    }
    const channel = guild.findChannel(channelId)
    if (!channel) {
      console.log('Create channel by message, id =', channelId)
      // type 假定是 0；后面其他字段都没用
      guild.addChannel({ id: channelId, name: channelId, type: 0, guild_id: guildId, owner_id: '', position: 0, parent_id: '' })
    }
  }

  addOrUpdateUser(member: IMember) {
    const guild = this.guildsMap[member.guild_id]
    if (guild) {
      guild.addOrUpdateUser(member)
    }
  }

  addOrUpdateUserByMessage(message: IMessage) {
    // message 返回的格式和实际签名不太符合，要做点兼容处理
    const guildId = (message as any).direct_message ? (message as any).src_guild_id : message.guild_id // 私信取 src_guild_id
    const member: IMember = {
      ...message.member,
      // 注意私信没有 nick 和 roles
      user: message.author,
      guild_id: guildId
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

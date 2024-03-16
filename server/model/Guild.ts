import { Bot } from '../adapter/Bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Channel } from './Channel'
import { Universal } from '@satorijs/satori'
import { User } from './User'
import { VERSION_CODE } from '../../interface/version'
import fs from 'fs'

const USER_DIR = './user'

export class Guild {
  readonly id: string
  name: string
  icon: string
  private readonly bot: Bot
  private channelsMap: Record<string, Channel> = {}
  private usersMap: Record<string, User> = {}

  constructor(bot: Bot, id: string, name?: string, icon?: string) {
    makeAutoObservable(this)
    this.bot = bot
    this.id = id
    this.name = name || id
    this.icon = icon || ''
    this.fetchChannels()
    // this.fetchUsers()
    this.loadUsers()
  }

  get allChannels() {
    return Object.values(this.channelsMap)
  }

  get allUsers() {
    return Object.values(this.usersMap)
  }

  findChannel(id: string): Channel | undefined {
    return this.channelsMap[id]
  }

  findUser(id: string) {
    return this.usersMap[id] ?? User.createTemp(this.bot, id, this.id)
  }

  addChannel(channel: { id: string, name: string, type: number }) {
    this.channelsMap[channel.id] = new Channel(this.bot, channel.id, this.id, channel.name, channel.type)
  }
  //
  // updateChannel(channel: IChannel) {
  //   const chan = this.channelsMap[channel.id]
  //   if (chan) {
  //     chan.name = channel.name
  //   }
  // }
  //
  // deleteChannel(id: string) {
  //   delete this.channelsMap[id]
  // }

  addOrUpdateUser(author: Universal.GuildMember & Universal.User) {
    const user = this.usersMap[author.id]
    if (user) {
      // 判断是否有更新需要持久化
      let updated = false
      if (author.name && author.name !== user.name) {
        user.name = author.name
        updated = true
      }
      if (author.avatar && author.avatar !== user.avatar) {
        user.avatar = author.avatar
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
      const newUser = new User(this.bot, {
        id: author.id,
        guildId: this.id,
        name: author.name ?? author.id,
        avatar: author.avatar ?? '',
        isBot: author.isBot ?? false
      })
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

  private async fetchChannels() {
    this.channelsMap = {}
    try {
      const list: Universal.Channel[] = []
      let nextToken: string | undefined = undefined
      do {
        const { data, next } = await this.bot.api.getChannelList(this.id, nextToken = undefined)
        list.push(...data)
        nextToken = next
      } while (nextToken)
      runInAction(() => {
        const channels = list
          .filter(channel => Channel.VALID_TYPES.includes(channel.type))
          .map(channel => new Channel(this.bot, channel.id, this.id, channel.name, channel.type))
        this.channelsMap = channels.reduce((obj, chan) => Object.assign(obj, { [chan.id]: chan }), {})
      })
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }

  // user 持久化相关
  private get userPersistenceFilename() {
    return `${USER_DIR}/${this.bot.platform}_${this.id}.json`
  }

  private saveUsers() {
    const allUsersOfGuild = Object.values(this.usersMap).map(user => user.toJSON)
    console.log('[Guild] 保存用户列表，count=', allUsersOfGuild.length)
    const data = { version: VERSION_CODE, list: allUsersOfGuild }
    if (!fs.existsSync(USER_DIR)) {
      fs.mkdirSync(USER_DIR)
    }
    fs.writeFile(this.userPersistenceFilename, JSON.stringify(data), (e) => {
      if (e) {
        console.error('[Guild] 保存用户列表失败', e)
      }
    })
  }

  private loadUsers() {
    console.log('[Guild] 开始读取用户，guildId=', this.id)
    const filename = this.userPersistenceFilename
    if (!fs.existsSync(filename)) return
    try {
      const str = fs.readFileSync(filename, 'utf8')
      const { version, list } = JSON.parse(str) as { version: number, list: User['toJSON'][] }
      const users = list.map(data => User.fromJSON(this.bot, data))
      this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
      // 一次性传给前端吧
    } catch (e) {
      console.error(`[Guild] ${filename} 用户列表解析失败`, e)
    }
  }
}

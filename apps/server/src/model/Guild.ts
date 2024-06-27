import fs from 'fs'
import { makeAutoObservable, runInAction } from 'mobx'
import { VERSION_CODE } from '@paotuan/types'
import { Channel } from './Channel'
import { Bot } from '../adapter/Bot'
import { Universal } from '../adapter/satori'
import { User } from './User'
import { resolveRootDir } from '../utils'

const USER_DIR = resolveRootDir('user')

export class Guild {
  readonly id: string
  name: string
  icon: string
  private readonly bot: Bot
  private channelsMap: Record<string, Channel> = {}
  private usersMap: Record<string, User> = {}
  // 用于创建新的文字子频道，所在分组
  private channelGroupId4Create: string | undefined

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

  async createChannel(name: string) {
    try {
      const resp = await this.bot.api.createChannel(this.id, { type: Universal.Channel.Type.TEXT, name, parentId: this.channelGroupId4Create })
      this.addChannel({ id: resp.id, name, type: Universal.Channel.Type.TEXT })
      return true
    } catch (e) {
      console.error('[Guild] 创建子频道失败', e)
      return false
    }
  }

  addOrUpdateUser(author: Universal.GuildMember & Universal.User) {
    const authorName = author.nick ?? author.nickname ?? author.name ?? author.username
    const user = this.usersMap[author.id]
    if (user) {
      // 判断是否有更新需要持久化
      let updated = false
      if (authorName && authorName !== user.name) {
        user.name = authorName
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
        name: authorName ?? author.id,
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
        this.detectChannelGroupId4Create(list)
      })
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }

  // 获取可用于创建文字子频道的分组 id
  private detectChannelGroupId4Create(list: Universal.Channel[]) {
    // qq 频道需强制指定文字分组，kook 不需要
    if (this.bot.platform !== 'qqguild') return
    const categories = list.filter(channel => channel.type === Universal.Channel.Type.CATEGORY)
    // qq 频道经测试，只能在 name = 讨论组 的 group 下创建 // 万一还有一些用的是原来的 活动 ？
    const qqTextGroup = categories.find(channel => channel.name === '讨论组') || categories.find(channel => channel.name === '活动')
    if (qqTextGroup) {
      this.channelGroupId4Create = qqTextGroup.id
      return
    }
    // 放到已经有其他文字子频道的分组下面，这样成功概率更高
    const hasTextGroup = categories.find(category => {
      const parentId = category.id
      return !!list.find(channel => channel.type === Universal.Channel.Type.TEXT && channel.parentId === parentId)
    })
    if (hasTextGroup) {
      this.channelGroupId4Create = hasTextGroup.id
      return
    }
    // 都没有找到，默认取第一个
    console.warn('[Guild] 未找到符合条件的文字子频道分组，QQ 接口可能改动。若创建子频道失败，请联系开发者')
    this.channelGroupId4Create = categories[0]?.id
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
    if (!fs.existsSync(filename)) {
      this.tryLoadV1Data()
      return
    }
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

  private tryLoadV1Data() {
    if (this.bot.platform !== 'qqguild') return
    const filename = `${USER_DIR}/${this.id}.json`
    if (!fs.existsSync(filename)) return
    try {
      console.log('[Guild] 开始读取旧版用户列表，guildId=', this.id)
      const str = fs.readFileSync(filename, 'utf8')
      const { list } = JSON.parse(str)
      const users: User[] = list.map((item: any) => User.fromJSON(this.bot, {
        id: item.id,
        guildId: item.guildId,
        isBot: item.bot,
        name: item.nick || item.username,
        avatar: item.avatar,
        deleted: item.deleted
      }))
      this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
      // 保存一次避免下次再次处理
      this.saveUsers()
    } catch (e) {
      console.error(`[Guild] ${filename} 用户列表解析失败`, e)
    }
  }
}

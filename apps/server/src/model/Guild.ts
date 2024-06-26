import { IUser } from '@paotuan/types'
import { Channel } from './Channel'
import { Bot } from '../adapter/Bot'
import { Universal } from '../adapter/satori'
import { User } from './User'
import { GlobalStore } from '../state'
import { GuildUnionId } from '../adapter/utils'

// const USER_DIR = resolveRootDir('user')

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
    this.bot = bot
    this.id = id
    this.name = name || id
    this.icon = icon || ''
    this.fetchChannels()
    // this.fetchUsers()
    // todo 后续处理
    // this.loadUsers()
  }

  get allChannels() {
    return Object.values(this.channelsMap)
  }

  private get guildUnionId(): GuildUnionId {
    return `${this.bot.platform}_${this.id}`
  }

  private get store() {
    return GlobalStore.Instance.guild(this.guildUnionId)
  }

  findChannel(id: string): Channel | undefined {
    return this.channelsMap[id]
  }

  findUser(id: string) {
    return this.usersMap[id] ?? User.createTemp(this.bot, id, this.id)
  }

  addChannel(channel: { id: string, name: string, type: number }) {
    this.channelsMap[channel.id] = new Channel(this.bot, channel.id, this.id, channel.name, channel.type)
    this.bot.guilds.notifyChannelListChange()
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
    const authorName = getUserName(author)
    const user = this.usersMap[author.id]
    if (user) {
      // 判断是否有更新
      if (authorName && authorName !== user.name) {
        user.name = authorName
      }
      if (author.avatar && author.avatar !== user.avatar) {
        user.avatar = author.avatar
      }
      if (user.deleted) {
        user.deleted = false
      }
    } else {
      const newUserProto: IUser = {
        id: author.id,
        name: authorName ?? author.id,
        avatar: author.avatar ?? '',
        isBot: author.isBot ?? false,
        deleted: false
      }
      // 新用户存入 syncstore
      this.store.users[newUserProto.id] = newUserProto
      const newUser = new User(this.bot, this.id, this.store.users[newUserProto.id])
      this.usersMap[newUser.id] = newUser
    }
  }

  deleteUser(id: string) {
    const user = this.usersMap[id]
    if (user && !user.deleted) {
      user.deleted = true
    }
  }

  deleteUsersBatch(ids: string[]) {
    ids.forEach(id => {
      const user = this.usersMap[id]
      if (user && !user.deleted) {
        user.deleted = true
      }
    })
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
      const channels = list
        .filter(channel => Channel.VALID_TYPES.includes(channel.type))
        .map(channel => new Channel(this.bot, channel.id, this.id, channel.name, channel.type))
      this.channelsMap = channels.reduce((obj, chan) => Object.assign(obj, { [chan.id]: chan }), {})
      this.bot.guilds.notifyChannelListChange()
      this.detectChannelGroupId4Create(list)
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }

  // 获取可用于创建文字子频道的分组 id
  private detectChannelGroupId4Create(list: Universal.Channel[]) {
    // qq 频道需强制指定文字分组，kook 不需要
    if (this.bot.platform !== 'qqguild') return
    const categories = list.filter(channel => channel.type === Universal.Channel.Type.CATEGORY)
    // qq 频道经测试，只能在活动类型下创建
    const qqTextGroup = categories.find(channel => channel.name === '活动')
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
    this.channelGroupId4Create = categories[0]?.id
  }

  // user 持久化相关
  // private get userPersistenceFilename() {
  //   return `${USER_DIR}/${this.bot.platform}_${this.id}.json`
  // }
  //
  // private saveUsers() {
  //   const allUsersOfGuild = Object.values(this.usersMap).map(user => user.toJSON)
  //   console.log('[Guild] 保存用户列表，count=', allUsersOfGuild.length)
  //   const data = { version: VERSION_CODE, list: allUsersOfGuild }
  //   if (!fs.existsSync(USER_DIR)) {
  //     fs.mkdirSync(USER_DIR)
  //   }
  //   fs.writeFile(this.userPersistenceFilename, JSON.stringify(data), (e) => {
  //     if (e) {
  //       console.error('[Guild] 保存用户列表失败', e)
  //     }
  //   })
  // }
  //
  // private loadUsers() {
  //   console.log('[Guild] 开始读取用户，guildId=', this.id)
  //   const filename = this.userPersistenceFilename
  //   if (!fs.existsSync(filename)) {
  //     this.tryLoadV1Data()
  //     return
  //   }
  //   try {
  //     const str = fs.readFileSync(filename, 'utf8')
  //     const { version, list } = JSON.parse(str) as { version: number, list: User['toJSON'][] }
  //     const users = list.map(data => User.fromJSON(this.bot, data))
  //     this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
  //     // 一次性传给前端吧
  //   } catch (e) {
  //     console.error(`[Guild] ${filename} 用户列表解析失败`, e)
  //   }
  // }
  //
  // private tryLoadV1Data() {
  //   if (this.bot.platform !== 'qqguild') return
  //   const filename = `${USER_DIR}/${this.id}.json`
  //   if (!fs.existsSync(filename)) return
  //   try {
  //     console.log('[Guild] 开始读取旧版用户列表，guildId=', this.id)
  //     const str = fs.readFileSync(filename, 'utf8')
  //     const { list } = JSON.parse(str)
  //     const users: User[] = list.map((item: any) => User.fromJSON(this.bot, {
  //       id: item.id,
  //       guildId: item.guildId,
  //       isBot: item.bot,
  //       name: item.nick || item.username,
  //       avatar: item.avatar,
  //       deleted: item.deleted
  //     }))
  //     this.usersMap = users.reduce((obj, user) => Object.assign(obj, { [user.id]: user }), {})
  //     // 保存一次避免下次再次处理
  //     this.saveUsers()
  //   } catch (e) {
  //     console.error(`[Guild] ${filename} 用户列表解析失败`, e)
  //   }
  // }
}

// 从 Universal User 中获取 name
function getUserName(author: Universal.GuildMember & Universal.User) {
  // 部分场景使用的仍是已废弃字段
  let name = author.nick ?? author.nickname ?? author.name ?? author.username
  // qq 机器人去除测试中尾缀
  if (name && author.isBot) {
    name = name.replace(/-测试中$/, '')
  }
  return name
}

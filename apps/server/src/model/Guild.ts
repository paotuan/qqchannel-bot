import { IUser } from '@paotuan/types'
import { Channel } from './Channel'
import { Bot } from '../adapter/Bot'
import { Universal } from '../adapter/satori'
import { User } from './User'
import { GlobalStore } from '../state'
import { GuildUnionId } from '../adapter/utils'

export interface IUserQuery {
  name?: string
  // isBot?: boolean 强制 false
  // deleted?: boolean 强制 false
}

export class Guild {
  readonly id: string
  name: string
  icon: string
  private readonly bot: Bot
  private channelsMap: Record<string, Channel> = {}
  // 用于创建新的文字子频道，所在分组
  private channelGroupId4Create: string | undefined
  // 用于创建新的文字子频道，待创建的类型
  private channelType4Create = Universal.Channel.Type.TEXT
  // 按需将 IUser 转化为 User 对象
  private usersCache = new Map<string, User>()

  constructor(bot: Bot, id: string, name?: string, icon?: string) {
    this.bot = bot
    this.id = id
    this.name = name || id
    this.icon = icon || ''
    // qq 群不支持获取列表
    // onebot 场景，目前 gsk 通过该 api 返回的 channelId 和消息体中的 channelId 不一致
    //   根据 gsk 文档的描述，这可能是一个协议层面的问题，以至于需要转换 https://www.yuque.com/km57bt/hlhnxg/onvg3d3uf342bwnq
    //   因此暂时屏蔽此接口调用，以消息体中的值为准
    if (bot.platform !== 'qq' && bot.platform !== 'onebot') {
      this.fetchChannels()
    }
    // this.fetchUsers()
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
    if (this.usersCache.has(id)) {
      return this.usersCache.get(id)!
    }
    const proto = this.store.users[id]
    if (proto) {
      const user = new User(this.bot, this.id, proto)
      this.usersCache.set(id, user)
      return user
    }
    return User.createTemp(this.bot, id, this.id)
  }

  existUser(id: string) {
    return !!this.store.users[id]
  }

  queryIUser(query: IUserQuery = {}) {
    let list = Object.values(this.store.users).filter(u => !u.deleted && !u.isBot)
    if (query.name) {
      const keyword = query.name.toLowerCase()
      list = list.filter(data => data.name.toLowerCase().includes(keyword))
    }
    return list
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
      const resp = await this.bot.api.createChannel(this.id, { type: this.channelType4Create, name, parentId: this.channelGroupId4Create })
      this.addChannel({ id: resp.id, name, type: this.channelType4Create })
      return true
    } catch (e) {
      console.error('[Guild] 创建子频道失败', e)
      return false
    }
  }

  addOrUpdateUser(author: Universal.GuildMember & Universal.User) {
    const authorName = getUserName(author)
    const user = this.store.users[author.id]
    if (user) {
      // 判断是否有更新
      // 注意如果 nn.updateNick 为 always，导致昵称被更新为人物卡后
      // 如果我们能获取到平台昵称，用户下次发消息仍然会使用平台昵称更新
      // 考虑到这并不是我们最初的设计场景（最初只是为了简化解决 qq 获取不到昵称问题），就先不处理了
      // 用户昵称为 guild 维度，而人物卡关联为 channel 维度，无论怎么处理，都会显得有点奇怪
      // 比较完善的做法可能需要引入私有备注（per channel）的概念，但引入了更多的复杂度，私以为绝大多数时候用不到
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
    }
  }

  deleteUser(id: string) {
    const user = this.store.users[id]
    if (user && !user.deleted) {
      user.deleted = true
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
    // qq 频道经测试，只能在 name = 讨论组 的 group 下创建 // 万一还有一些用的是原来的 活动 ？
    const qqTextGroup = categories.find(channel => channel.name === '讨论组') || categories.find(channel => channel.name === '活动')
    if (qqTextGroup) {
      this.channelGroupId4Create = qqTextGroup.id
      this.channelType4Create = Universal.Channel.Type.TEXT
      return
    }
    // 放到已经有其他文字子频道的分组下面，这样成功概率更高
    const hasTextGroup = categories.find(category => {
      const parentId = category.id
      return !!list.find(channel => channel.type === Universal.Channel.Type.TEXT && channel.parentId === parentId)
    })
    if (hasTextGroup) {
      this.channelGroupId4Create = hasTextGroup.id
      this.channelType4Create = Universal.Channel.Type.TEXT
      return
    }
    // 新频道现在没有文字分组，不允许创建文字子频道，退而求其次创建语音子频道
    const voiceGroup = categories.find(channel => channel.name === '语音房')
    if (voiceGroup) {
      this.channelGroupId4Create = voiceGroup.id
      this.channelType4Create = Universal.Channel.Type.VOICE
      return
    }
    // 都没有找到，默认取第一个
    console.warn('[Guild] 未找到符合条件的文字/语音子频道分组，QQ 接口可能改动。若创建子频道失败，请联系开发者')
    this.channelGroupId4Create = categories[0]?.id
    this.channelType4Create = Universal.Channel.Type.TEXT
  }
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

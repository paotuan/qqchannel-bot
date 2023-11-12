import type { IMember, MessageToCreate } from 'qq-guild-bot'
import { makeAutoObservable } from 'mobx'
import type { QApi } from './index'
import type { IMessage } from 'qq-guild-bot'

/**
 * 频道用户实例
 */
export class User {
  readonly id: string
  readonly guildId: string // 这个用户所在频道的 id
  nick: string
  username: string
  avatar: string
  readonly bot: boolean
  deleted = false // user 退出不能删除，只标记为 delete，因为其他地方可能还需要 user 的相关信息
  private readonly api: QApi
  private userGuildId?: string // 私信频道 id
  lastMessage?: IMessage // 私信最新一条消息

  constructor(api: QApi, member: IMember, guildId?: string) {
    makeAutoObservable<this, 'api'>(this, { id: false, guildId: false, api: false })
    this.id = member.user.id
    this.guildId = guildId || member.guild_id // 请求成员列表不返回 guild_id，因此依赖外面传进来
    this.nick = member.nick
    this.username = member.user.username
    this.avatar = member.user.avatar
    this.bot = member.user.bot
    this.api = api
  }

  // 理论上只有 userId 和 guildId 也可以使用，只是昵称和头像没有，因此遇到这种情况可以创建一个临时的 User 使用，避免阻塞主流程
  static createTemp(api: QApi, userId: string, guildId: string) {
    console.log('[User] create temp, id=', userId, 'guildId=', guildId)
    const mockMember: IMember = {
      guild_id: guildId,
      joined_at: '', // useless
      nick: userId,
      user: {
        id: userId,
        username: userId,
        avatar: '',
        bot: false,
        union_openid: '', // useless
        union_user_account: '', // useless
      },
      roles: [], // useless
      deaf: false, // useless
      mute: false // useless
    }
    return new User(api, mockMember, guildId)
  }

  get persona() {
    return this.nick || this.username || this.id
  }

  async sendMessage(msg: MessageToCreate, userGuildId = this.userGuildId) {
    try {
      if (!userGuildId) {
        userGuildId = await this.fetchUserGuildId()
      }
      // 如没有指定发某条被动消息，则尝试尽量发被动
      if (!msg.msg_id) {
        msg.msg_id = this.getLastMessageIdForReply()
      }
      const res = await this.api.qqClient.directMessageApi.postDirectMessage(userGuildId, msg)
      console.log('[Message] 私信发送成功 ' + msg.content)
      this.userGuildId = userGuildId // 测试多次调用返回结果是一样的，可以缓存
      return res.data
    } catch (e) {
      console.error('[Message] 私信消息发送失败', e)
      return null
    }
  }

  private async fetchUserGuildId() {
    const { data } = await this.api.qqClient.directMessageApi.createDirectMessage({
      source_guild_id: this.guildId,
      recipient_id: this.id
    })
    console.log('[Message] 建立私信通道', data.guild_id)
    return data.guild_id
  }

  // 获取可用于回复的被动消息 id
  private getLastMessageIdForReply() {
    const lastMsgTime = this.lastMessage ? new Date(this.lastMessage.timestamp).getTime() : 0
    const currentTime = new Date().getTime()
    // 判断有没有超过被动消息有效期
    if (currentTime - lastMsgTime <= 5 * 60 * 1000 - 2000) {
      console.log('[Message] 命中被动消息缓存')
      return this.lastMessage?.id
    } else {
      this.lastMessage = undefined
      return undefined
    }
  }

  // region 序列化相关
  get toJSON() {
    return {
      id: this.id,
      guildId: this.guildId,
      nick: this.nick,
      username: this.username,
      avatar: this.avatar,
      bot: this.bot,
      deleted: this.deleted
    }
  }

  static fromJSON(api: QApi, data: User['toJSON']) {
    const mockMember: IMember = {
      guild_id: data.guildId,
      joined_at: '', // useless
      nick: data.nick,
      user: {
        id: data.id,
        username: data.username,
        avatar: data.avatar,
        bot: data.bot,
        union_openid: '', // useless
        union_user_account: '', // useless
      },
      roles: [], // useless
      deaf: false, // useless
      mute: false // useless
    }
    const user = new User(api, mockMember, data.guildId)
    user.deleted = data.deleted
    return user
  }
  // endregion
}

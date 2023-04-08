import type { IMember } from 'qq-guild-bot'
import { makeAutoObservable } from 'mobx'
import type { QApi } from './index'
import { MessageToCreate } from 'qq-guild-bot'

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

  get persona() {
    return this.nick || this.username || this.id
  }

  async sendMessage(msg: MessageToCreate, userGuildId = this.userGuildId) {
    try {
      if (!userGuildId) {
        userGuildId = await this.fetchUserGuildId()
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
}

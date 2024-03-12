import { Bot } from '../adapter/Bot'
import { makeAutoObservable } from 'mobx'
import { Session } from '@satorijs/satori'
import { removeBackspaces } from '../utils'

// todo 后续与 interface/common 合并
interface _IUser {
  id: string
  guildId: string
  name: string
  avatar: string
}

export class User implements _IUser {

  readonly id: string
  readonly guildId: string
  avatar: string
  name: string
  deleted = false

  lastSession?: Session // 私信最新一条消息
  private readonly bot: Bot

  constructor(bot: Bot, proto: _IUser) {
    makeAutoObservable(this)
    this.id = proto.id
    this.guildId = proto.guildId
    this.avatar = proto.avatar
    this.name = proto.name
    this.bot = bot
  }

  async sendMessage(content: string, session?: Session) {
    // 如没有指定发某条被动消息，则尝试尽量发被动
    if (!session) {
      session = this.getLastSessionForReply()
    }
    // 如果发送文字消息，则对文字消息做 trim。因为 qq 除 android 端都会自动 trim，为了保证结果在各个平台展示的一致性，此处先统一做 trim
    // 同时人肉对 \b 做下处理，支持退格，以应对自定义回复拼接时用户需要自定义的极端情况
    if (content) {
      content = removeBackspaces(content.trim())
    }
    try {
      const res = await this.bot.api.sendPrivateMessage(this.id, content, this.guildId, { session })
      const messageId = res.at(-1)!
      console.log('[Message] 私信发送成功 ' + content)
      return { id: messageId, content }
    } catch (e) {
      console.error('[Message] 私信消息发送失败', e)
      return null
    }
  }

  // 获取可用于回复的被动消息 id
  private getLastSessionForReply() {
    const lastMsgTime = this.lastSession?.timestamp ? new Date(this.lastSession.timestamp).getTime() : 0
    const currentTime = new Date().getTime()
    // 判断有没有超过被动消息有效期
    if (currentTime - lastMsgTime <= 5 * 60 * 1000 - 2000) {
      console.log('[Message] 命中被动消息缓存')
      return this.lastSession
    } else {
      this.lastSession = undefined
      return undefined
    }
  }

  // 理论上只有 userId 和 guildId 也可以使用，只是昵称和头像没有，因此遇到这种情况可以创建一个临时的 User 使用，避免阻塞主流程
  static createTemp(bot: Bot, id: string, guildId: string) {
    console.log('[User] create temp, id=', id, 'guildId=', guildId)
    return new User(bot, { id, guildId, name: id, avatar: '' })
  }

  get toJSON() {
    return {
      id: this.id,
      guildId: this.guildId,
      name: this.name,
      avatar: this.avatar,
      deleted: this.deleted
    }
  }

  static fromJSON(bot: Bot, data: User['toJSON']) {
    const user = new User(bot, data)
    user.deleted = data.deleted
    return user
  }
}

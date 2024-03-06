import { Bot } from '../adapter/Bot'
import { makeAutoObservable } from 'mobx'

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
  private readonly bot: Bot
  deleted = false

  constructor(bot: Bot, proto: _IUser) {
    makeAutoObservable(this)
    this.id = proto.id
    this.guildId = proto.guildId
    this.avatar = proto.avatar
    this.name = proto.name
    this.bot = bot
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

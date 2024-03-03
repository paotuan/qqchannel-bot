import { Bot } from '../adapter/Bot'
import { makeAutoObservable } from 'mobx'
import { Universal } from '@satorijs/satori'

export class Channel {
  static VALID_TYPES = [Universal.Channel.Type.TEXT, Universal.Channel.Type.VOICE] // 只支持文字、音视频子频道
  readonly id: string
  readonly guildId: string
  name: string
  type: Universal.Channel.Type
  private readonly bot: Bot

  constructor(bot: Bot, id: string, guildId: string, name: string | undefined, type: Universal.Channel.Type) {
    makeAutoObservable(this)
    this.bot = bot
    this.id = id
    this.guildId = guildId
    this.name = name || id
    this.type = type
  }
}

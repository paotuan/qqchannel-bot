import type { IMember } from 'qq-guild-bot'
import { makeAutoObservable } from 'mobx'
import type { QApi } from './index'
import { MessageToCreate } from 'qq-guild-bot'

/**
 * 频道用户实例
 */
export class User {
  readonly id: string
  readonly guildId: string
  nick: string
  username: string
  avatar: string
  readonly bot: boolean
  deleted = false // user 退出不能删除，只标记为 delete，因为其他地方可能还需要 user 的相关信息
  private readonly api: QApi

  constructor(api: QApi, member: IMember) {
    makeAutoObservable<this, 'api'>(this, { id: false, guildId: false, api: false })
    this.id = member.user.id
    this.guildId = member.guild_id
    this.nick = member.nick
    this.username = member.user.username
    this.avatar = member.user.avatar
    this.bot = member.user.bot
    this.api = api
  }

  sendMessage(msg: MessageToCreate, userGuildId?: string) {
    if (!userGuildId) return // todo 后面要加上主动私信逻辑
    this.api.qqClient.directMessageApi.postDirectMessage(userGuildId, msg)
      .then(() => {
        console.log('[Message] 私信发送成功 ' + msg.content)
      })
      .catch((err: any) => {
        console.error('[Message] 私信消息发送失败', err)
      })
  }
}

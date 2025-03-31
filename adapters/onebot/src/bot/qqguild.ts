import { Context, Universal } from '@satorijs/core'
import { BaseBot } from './base'
import { OneBotBot } from '.'
import * as OneBot from '../utils'

export namespace QQGuildBot {
  export interface Config extends BaseBot.Config {
    parent: OneBotBot<Context>
    profile: OneBot.GuildServiceProfile
  }
}

export class QQGuildBot<C extends Context> extends BaseBot<C> {
  declare parent: OneBotBot<Context>
  hidden = true

  constructor(ctx: C, config: QQGuildBot.Config) {
    super(ctx, config, 'qqguild')
    this.platform = 'qqguild'
    this.selfId = config.profile.tiny_id
    this.parent = config.parent
    this.internal = config.parent.internal
    this.user.name = config.profile.nickname
    this.user.avatar = config.profile.avatar_url
    this.parent.guildBot = this
  }

  get status() {
    return this.parent.status
  }

  set status(status) {
    this.parent.status = status
  }

  async start() {
    await this.context.parallel('bot-connect', this)
  }

  async stop() {
    // Don't stop this bot twice
    if (!this.parent) return
    // prevent circular reference and use this as already disposed
    this.parent = undefined
    await this.context.parallel('bot-disconnect', this)
  }

  async getChannel(channelId: string, guildId?: string) {
    const { data } = await this.getChannelList(guildId)
    return data.find((channel) => channel.id === channelId)
  }

  async getChannelList(guildId: string) {
    const data = await this.internal.getGuildChannelList(guildId, false)
    return { data: (data || []).map(OneBot.adaptChannel) }
  }

  async getGuild(guildId: string) {
    const data = await this.internal.getGuildMetaByGuest(guildId)
    return OneBot.adaptGuild(data)
  }

  async getGuildList() {
    const data = await this.internal.getGuildList()
    return { data: data.map(OneBot.adaptGuild) }
  }

  async getGuildMember(guildId: string, userId: string) {
    const profile = await this.internal.getGuildMemberProfile(guildId, userId)
    return OneBot.adaptQQGuildMemberProfile(profile)
  }

  async getGuildMemberList(guildId: string) {
    let nextToken: string | undefined
    let list: Universal.GuildMember[] = []
    while (true) {
      const data = await this.internal.getGuildMemberList(guildId, nextToken)
      if (!data.members?.length) break
      list = list.concat(data.members.map(OneBot.adaptQQGuildMemberInfo))
      if (data.finished) break
      nextToken = data.next_token
    }
    return { data: list }
  }
}

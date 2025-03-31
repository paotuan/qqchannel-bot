import { Context, noop, Schema, Session } from '@satorijs/core'
import { HttpServer } from '../http'
import { WsClient, WsServer } from '../ws'
import { QQGuildBot } from './qqguild'
import { BaseBot } from './base'
import * as OneBot from '../utils'

export * from './base'
export * from './cqcode'
export * from './message'
export * from './qqguild'

export class OneBotBot<C extends Context, T extends OneBotBot.Config = OneBotBot.Config> extends BaseBot<C, T> {
  public guildBot: QQGuildBot<C>

  constructor(ctx: C, config: T) {
    super(ctx, config, 'onebot')
    this.selfId = config.selfId
    this.internal = new OneBot.Internal(this)
    this.user.avatar = `http://q.qlogo.cn/headimg_dl?dst_uin=${config.selfId}&spec=640`

    if (config.protocol === 'http') {
      ctx.plugin(HttpServer, this)
    } else if (config.protocol === 'ws') {
      ctx.plugin(WsClient, this as any)
    } else if (config.protocol === 'ws-reverse') {
      ctx.plugin(WsServer, this)
    }
  }

  async stop() {
    if (this.guildBot) {
      // QQGuild stub bot should also be removed
      delete this.ctx.bots[this.guildBot.sid]
    }
    await super.stop()
  }

  async initialize() {
    await Promise.all([
      this.getLogin(),
      this.setupGuildService().catch(noop),
    ]).then(() => this.online(), error => this.offline(error))
  }

  async setupGuildService() {
    const profile = await this.internal.getGuildServiceProfile()
    // guild service is not supported in this account
    if (!profile?.tiny_id || profile.tiny_id === '0') return
    this.ctx.plugin(QQGuildBot, {
      profile,
      parent: this,
      advanced: this.config.advanced,
    })
  }

  async getChannel(channelId: string) {
    const data = await this.internal.getGroupInfo(channelId)
    return OneBot.adaptChannel(data)
  }

  async getGuild(guildId: string) {
    const data = await this.internal.getGroupInfo(guildId)
    return OneBot.adaptGuild(data)
  }

  async getGuildList() {
    const data = await this.internal.getGroupList()
    return { data: data.map(OneBot.adaptGuild) }
  }

  async getChannelList(guildId: string) {
    return { data: [await this.getChannel(guildId)] }
  }

  async getGuildMember(guildId: string, userId: string) {
    const data = await this.internal.getGroupMemberInfo(guildId, userId)
    return OneBot.decodeGuildMember(data)
  }

  async getGuildMemberList(guildId: string) {
    const data = await this.internal.getGroupMemberList(guildId)
    return { data: data.map(OneBot.decodeGuildMember) }
  }

  async kickGuildMember(guildId: string, userId: string, permanent?: boolean) {
    return this.internal.setGroupKick(guildId, userId, permanent)
  }

  async muteGuildMember(guildId: string, userId: string, duration: number) {
    return this.internal.setGroupBan(guildId, userId, Math.round(duration / 1000))
  }

  async muteChannel(channelId: string, guildId?: string, enable?: boolean) {
    return this.internal.setGroupWholeBan(channelId, enable)
  }

  async checkPermission(name: string, session: Partial<Session>) {
    if (name === 'onebot.group.admin') {
      return session.author?.roles?.[0] === 'admin'
    } else if (name === 'onebot.group.owner') {
      return session.author?.roles?.[0] === 'owner'
    }
    return super.checkPermission(name, session)
  }
}

export namespace OneBotBot {
  export interface BaseConfig extends BaseBot.Config {
    selfId: string
    password?: string
    token?: string
  }

  export const BaseConfig: Schema<BaseConfig> = Schema.object({
    selfId: Schema.string().description('机器人的账号。').required(),
    token: Schema.string().role('secret').description('发送信息时用于验证的字段，应与 OneBot 配置文件中的 `access_token` 保持一致。'),
    protocol: process.env.KOISHI_ENV === 'browser'
      ? Schema.const('ws').default('ws')
      : Schema.union(['http', 'ws', 'ws-reverse']).description('选择要使用的协议。').default('ws-reverse'),
  })

  export type Config = BaseConfig & (HttpServer.Options | WsServer.Options | WsClient.Options)

  export const Config: Schema<Config> = Schema.intersect([
    BaseConfig,
    Schema.union([
      HttpServer.Options,
      WsClient.Options,
      WsServer.Options,
    ]),
    Schema.object({
      advanced: BaseBot.AdvancedConfig,
    }),
  ])
}

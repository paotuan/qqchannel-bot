import type { IDiceRollContext } from './dice/utils'
import type { Wss } from '../app/wss'
import type { ChannelConfig } from './config/config'
import type { StandardDiceRoll } from './dice/standard'
import type { ICardQuery } from '@paotuan/types'
import type { Platform, UserRole } from '@paotuan/config'
import { getChannelUnionId } from '../adapter/utils'
import { Bot } from '../adapter/Bot'

type InitDiceRollContextArgs = Partial<IDiceRollContext> & { userId: string }

// 简化一些通用方法和配置的获取
export class DiceRollContext implements IDiceRollContext {

  private readonly bot: Bot
  private readonly wss: Wss
  platform?: Platform
  guildId?: string
  channelId?: string
  userId: string
  username: string
  userRole: UserRole
  config: ChannelConfig
  getCard: IDiceRollContext['getCard']
  linkCard: IDiceRollContext['linkCard']
  queryCard: IDiceRollContext['queryCard']
  opposedRoll?: StandardDiceRoll
  setBackgroundLogEnabled: IDiceRollContext['setBackgroundLogEnabled']

  constructor(bot: Bot, args: InitDiceRollContextArgs) {
    this.bot = bot
    this.wss = bot.wss
    this.platform = args.platform
    this.guildId = args.guildId
    this.channelId = args.channelId
    this.userId = args.userId
    this.username = args.username ?? args.userId
    this.userRole = args.userRole ?? 'user'
    this.config = args.config ?? this.wss.config.getChannelConfig(this.channelUnionId ?? 'default')
    this.getCard = args.getCard ?? this._getCard.bind(this)
    this.linkCard = args.linkCard ?? this._linkCard.bind(this)
    this.queryCard = args.queryCard ?? this._queryCard.bind(this)
    this.opposedRoll = args.opposedRoll
    this.setBackgroundLogEnabled = args.setBackgroundLogEnabled ?? this._setBackgroundLogEnabled.bind(this)
  }

  get botId() {
    return this.bot.id
  }

  get channelUnionId() {
    if (this.platform && this.guildId && this.channelId) {
      return getChannelUnionId(this.platform, this.guildId, this.channelId)
    } else {
      return undefined
    }
  }

  private _getCard(userId: string) {
    return this.channelUnionId ? this.wss.cards.getCard(this.channelUnionId, userId) : undefined
  }

  private _linkCard(cardName: string, userId?: string) {
    if (this.channelUnionId) {
      this.wss.cards.linkCard(this.channelUnionId, cardName, userId)
    }
  }

  private _queryCard(query: ICardQuery = {}) {
    return this.wss.cards.queryCard(query)
  }

  private _setBackgroundLogEnabled(enabled: boolean) {
    if (this.bot && this.channelUnionId) {
      this.bot.logs.setBackgroundLogEnabled(this.channelUnionId, enabled)
    }
  }
}

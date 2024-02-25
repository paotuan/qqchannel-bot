import type { IDiceRollContext } from './dice/utils'
import type { Wss } from '../app/wss'
import type { ChannelConfig } from './config/config'
import type { StandardDiceRoll } from './dice/standard'
import type { ICardQuery, UserRole } from '../../interface/config'
import { QApi } from './qapi'

type InitDiceRollContextArgs = Partial<IDiceRollContext> & { userId: string }

// 简化一些通用方法和配置的获取
export class DiceRollContext implements IDiceRollContext {

  private readonly qApi: QApi
  private readonly wss: Wss
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

  constructor(qapi: QApi, args: InitDiceRollContextArgs) {
    this.qApi = qapi
    this.wss = qapi.wss
    this.guildId = args.guildId
    this.channelId = args.channelId
    this.userId = args.userId
    this.username = args.username ?? args.userId
    this.userRole = args.userRole ?? 'user'
    this.config = args.config ?? this.wss.config.getChannelConfig(this.channelId ?? 'default')
    this.getCard = args.getCard ?? this._getCard.bind(this)
    this.linkCard = args.linkCard ?? this._linkCard.bind(this)
    this.queryCard = args.queryCard ?? this._queryCard.bind(this)
    this.opposedRoll = args.opposedRoll
    this.setBackgroundLogEnabled = args.setBackgroundLogEnabled ?? this._setBackgroundLogEnabled.bind(this)
  }

  get botId() {
    return this.qApi.appid // todo 暂时不从外部读了，反正后面要重构
  }

  private _getCard(userId: string) {
    return this.channelId ? this.wss.cards.getCard(this.channelId, userId) : undefined
  }

  private _linkCard(cardName: string, userId?: string) {
    if (this.channelId) {
      this.wss.cards.linkCard(this.channelId, cardName, userId)
    }
  }

  private _queryCard(query: ICardQuery = {}) {
    return this.wss.cards.queryCard(query)
  }

  private _setBackgroundLogEnabled(enabled: boolean) {
    if (this.qApi && this.channelId) {
      this.qApi.logs.setBackgroundLogEnabled(this.channelId, enabled)
    }
  }
}

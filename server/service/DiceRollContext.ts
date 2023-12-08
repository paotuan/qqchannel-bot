import type { IDiceRollContext } from './dice/utils'
import type { Wss } from '../app/wss'
import type { ChannelConfig } from './config/config'
import type { StandardDiceRoll } from './dice/standard'
import type { ICardQuery, UserRole } from '../../interface/config'

type InitDiceRollContextArgs = Partial<IDiceRollContext> & { userId: string }

// 简化一些通用方法和配置的获取
export class DiceRollContext implements IDiceRollContext {

  private readonly wss: Wss
  channelId?: string
  userId: string
  username: string
  userRole: UserRole
  config: ChannelConfig
  getCard: IDiceRollContext['getCard']
  linkCard: IDiceRollContext['linkCard']
  queryCard: IDiceRollContext['queryCard']
  opposedRoll?: StandardDiceRoll

  constructor(wss: Wss, args: InitDiceRollContextArgs) {
    this.wss = wss
    this.channelId = args.channelId
    this.userId = args.userId
    this.username = args.username ?? args.userId
    this.userRole = args.userRole ?? 'user'
    this.config = args.config ?? wss.config.getChannelConfig(this.channelId ?? 'default')
    this.getCard = args.getCard ?? this._getCard.bind(this)
    this.linkCard = args.linkCard ?? this._linkCard.bind(this)
    this.queryCard = args.queryCard ?? this._queryCard.bind(this)
    this.opposedRoll = args.opposedRoll
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
}

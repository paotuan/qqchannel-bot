import type { IDiceRollContext } from './dice/utils'
import type { Wss } from '../app/wss'
import type { ChannelConfig } from './config/config'
import type { StandardDiceRoll } from './dice/standard'
import type { UserRole } from '../../interface/config'

type InitDiceRollContextArgs = Partial<IDiceRollContext> & { userId: string }

// 简化一些通用方法和配置的获取
export class DiceRollContext implements IDiceRollContext {

  channelId?: string
  userId: string
  username: string
  userRole: UserRole
  config: ChannelConfig
  getCard: IDiceRollContext['getCard']
  opposedRoll?: StandardDiceRoll

  constructor(wss: Wss, args: InitDiceRollContextArgs) {
    this.channelId = args.channelId
    this.userId = args.userId
    this.username = args.username ?? args.userId
    this.userRole = args.userRole ?? 'user'
    this.config = args.config ?? wss.config.getChannelConfig(this.channelId ?? 'default')
    this.getCard = args.getCard ?? ((userId: string) => this.channelId ? wss.cards.getCard(this.channelId, userId) : undefined)
    this.opposedRoll = args.opposedRoll
  }
}

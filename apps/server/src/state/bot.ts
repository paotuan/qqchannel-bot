import { Universal } from '../adapter/satori'

/**
 * bot 级别需要同步的数据
 */
export interface IBotState {
  guilds: {
    byId: Record<string, Universal.Guild>
  }
  channels: {
    byId: Record<string, Universal.Channel>
  }
}

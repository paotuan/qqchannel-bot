import { Bot } from '../adapter/Bot'
import { makeAutoObservable, runInAction } from 'mobx'
import { Channel } from './Channel'
import { Universal } from '@satorijs/satori'

export class Guild {
  readonly id: string
  name: string
  icon: string
  private readonly bot: Bot
  private channelsMap: Record<string, Channel> = {}

  constructor(bot: Bot, id: string, name?: string, icon?: string) {
    makeAutoObservable(this)
    this.bot = bot
    this.id = id
    this.name = name || id
    this.icon = icon || ''
    this.fetchChannels()
  }

  get allChannels() {
    return Object.values(this.channelsMap)
  }

  private async fetchChannels() {
    this.channelsMap = {}
    try {
      const list: Universal.Channel[] = []
      let nextToken: string | undefined = undefined
      do {
        const { data, next } = await this.bot.api.getChannelList(this.id, nextToken = undefined)
        list.push(...data)
        nextToken = next
      } while (nextToken)
      runInAction(() => {
        const channels = list
          .filter(channel => Channel.VALID_TYPES.includes(channel.type))
          .map(channel => new Channel(this.bot, channel.id, this.id, channel.name, channel.type))
        this.channelsMap = channels.reduce((obj, chan) => Object.assign(obj, { [chan.id]: chan }), {})
      })
    } catch (e) {
      console.error('获取子频道信息失败', e)
    }
  }
}

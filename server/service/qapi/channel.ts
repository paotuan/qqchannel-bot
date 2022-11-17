import { makeAutoObservable } from 'mobx'
import type { QApi } from './index'
import { MessageToCreate } from 'qq-guild-bot'
import type { ICustomReplyConfig } from '../../../interface/config'

/**
 * 子频道实例
 */
export class Channel {
  static TYPE_TEXT = 0
  readonly id: string
  readonly guildId: string
  name: string
  private readonly api: QApi

  constructor(api: QApi, id: string, guildId: string, name: string) {
    makeAutoObservable<this, 'api'>(this, { id: false, guildId: false, api: false })
    this.id = id
    this.guildId = guildId
    this.name = name
    this.api = api
  }

  // 子频道配置
  private get config() {
    return this.api.wss.config.getChannelConfig(this.id)
  }

  // 默认骰配置
  get defaultRoll() {
    return this.config.defaultRoll
  }

  // 子频道 embed 自定义回复配置索引
  private get embedCustomReplyMap(): Record<string, ICustomReplyConfig> {
    const items = this.config.embedPlugin.customReply
    if (!items) return {}
    const embedPluginId = this.config.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  }

  // 子频道自定义回复处理器列表
  get customReplyProcessors() {
    // todo map 还没把插件放进来
    return this.config.customReplyIds.filter(item => item.enabled).map(item => this.embedCustomReplyMap[item.id]).filter(conf => !!conf)
  }

  // 发消息到该子频道
  async sendMessage(msg: MessageToCreate, recordLog = true) {
    // todo 未来把 note 的逻辑也收过来
    try {
      // console.time('message')
      const res = await this.api.qqClient.messageApi.postMessage(this.id, msg)
      // console.timeEnd('message')
      console.log('[Message] 发送成功 ' + msg.content)
      if (recordLog) {
        this.api.logs.pushToClients(this.guildId, this.id, {
          msgId: res.data.id,
          msgType: 'text',
          userId: this.api.botInfo?.id || '',
          username: this.api.botInfo?.username || '',
          content: msg.content!,
          timestamp: res.data.timestamp
        })
      }
      return res.data
    } catch (e) {
      console.error('[Message] 发送失败', e)
      return null
    }
  }
}

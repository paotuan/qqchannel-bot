import { makeAutoObservable } from 'mobx'
import type { QApi } from './index'
import { MessageToCreate } from 'qq-guild-bot'

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

  async sendMessage(msg: MessageToCreate, recordLog = true) {
    // todo 未来把 note 的逻辑也收过来
    try {
      // console.time('message')
      const res = await this.api.qqClient.messageApi.postMessage(this.id, msg)
      // console.timeEnd('message')
      console.log('[Message] 发送成功 ' + msg.content)
      if (recordLog) {
        this.api.logs.pushToClients(this.id, {
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

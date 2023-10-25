import { makeAutoObservable } from 'mobx'
import type { QApi } from './index'
import type { ChannelType, IMessage, MessageToCreate } from 'qq-guild-bot'
import type { MessageType } from '../../../interface/common'
import * as FormData from 'form-data'
import fetch from 'node-fetch'

/**
 * 子频道实例
 */
export class Channel {
  static VALID_TYPES = [0, 2, 10005] // 只支持文字、音频、视频子频道
  readonly id: string
  readonly guildId: string
  name: string
  type: 0 | 2 | 10005
  lastMessage?: IMessage // 子频道最新一条消息
  private readonly api: QApi

  constructor(api: QApi, id: string, guildId: string, name: string, type: ChannelType) {
    makeAutoObservable<this, 'api'>(this, { id: false, guildId: false, api: false })
    this.id = id
    this.guildId = guildId
    this.name = name
    this.type = type as 0 | 2 | 10005 // 外部已经过滤过了
    this.api = api
  }

  // 发消息到该子频道
  async sendMessage(msg: MessageToCreate, recordLog = true) {
    // 如没有指定发某条被动消息，则尝试尽量发被动
    if (!msg.msg_id) {
      msg.msg_id = this.getLastMessageIdForReply()
    }
    // 如果发送文字消息，则对文字消息做 trim。因为 qq 除 android 端都会自动 trim，为了保证结果在各个平台展示的一致性，此处先统一做 trim
    if (msg.content) {
      msg.content = msg.content.trim()
    }
    try {
      // console.time('message')
      const res = await this.api.qqClient.messageApi.postMessage(this.id, msg)
      // console.timeEnd('message')
      console.log('[Message] 发送成功 ' + msg.content)
      if (recordLog) {
        this.sendLogAsync(msg, res.data)
      }
      return res.data
    } catch (e) {
      console.error('[Message] 发送失败', e)
      return null
    }
  }

  // 发送本地图片到子频道
  async sendRawImageMessage(imgData: string, replyMsgId?: string, recordLog = true) {
    // 如没有指定发某条被动消息，则尝试尽量发被动
    if (!replyMsgId) {
      replyMsgId = this.getLastMessageIdForReply()
    }
    try {
      const formData = new FormData()
      if (replyMsgId) formData.append('msg_id', replyMsgId)
      // 根据 base64 解出 img buffer
      // https://stackoverflow.com/questions/11335460/how-do-i-parse-a-data-url-in-node
      const img = Buffer.from(imgData.split(',')[1], 'base64')
      formData.append('file_image', img, 'test.png') // 名字必须有以获取正确的 content-type, 但只要是图片就行
      // 1. 发消息
      // console.time('message')
      const res = await fetch(`https://api.sgroup.qq.com/channels/${this.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': formData.getHeaders()['content-type'],
          'Authorization': `Bot ${this.api.appid}.${this.api.token}`
        },
        body: formData
      })
      const resp = await res.json() as IMessage
      // console.timeEnd('message')
      console.log('[Message] 发送本地图片成功')
      // 2. 记录 log
      if (recordLog) {
        this.sendLogAsync(undefined, resp)
      }
      return resp
    } catch (e) {
      console.error('[Message] 发送本地图片失败', e)
      return null
    }
  }

  // 获取可用于回复的被动消息 id
  getLastMessageIdForReply() {
    const lastMsgTime = this.lastMessage ? new Date(this.lastMessage.timestamp).getTime() : 0
    const currentTime = new Date().getTime()
    // 判断有没有超过被动消息有效期
    if (currentTime - lastMsgTime <= 5 * 60 * 1000 - 2000) {
      console.log('[Message] 命中被动消息缓存')
      return this.lastMessage?.id
    } else {
      this.lastMessage = undefined
      return undefined
    }
  }

  // 记录 log
  private async sendLogAsync(msg: MessageToCreate | undefined, msgResp: IMessage) {
    // 如有 content，说明是文本消息，直接推
    if (msg?.content) {
      this.api.logs.pushToClients(this.guildId, this.id, {
        msgId: msgResp.id,
        msgType: 'text',
        userId: this.api.botInfo?.id || '',
        username: this.api.botInfo?.username || '',
        content: msg.content,
        timestamp: msgResp.timestamp
      })
      return
    }
    // 没 content 的情况，是图片，获取不到转存后的图片地址，需要单独请求下
    try {
      const resp = await this.api.qqClient.messageApi.message(this.id, msgResp.id)
      const detailMsg = resp.data.message
      let fetchedContent: string = detailMsg.content
      let msgType: MessageType = 'text'
      if (detailMsg.attachments?.[0]?.url) {
        fetchedContent = detailMsg.attachments[0].url
        msgType = 'image'
      }
      if (!fetchedContent) {
        fetchedContent = '消息为空或暂不支持'
      }
      this.api.logs.pushToClients(this.guildId, this.id, {
        msgId: msgResp.id,
        msgType: msgType,
        userId: this.api.botInfo?.id || '',
        username: this.api.botInfo?.username || '',
        content: fetchedContent,
        timestamp: msgResp.timestamp
      })
    } catch (e) {
      console.error('[Message] 获取消息详情失败', e)
    }
  }
}

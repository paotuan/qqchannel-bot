import { Bot } from '../adapter/Bot'
import { makeAutoObservable } from 'mobx'
import { Session, Universal } from '@satorijs/satori'
import { removeBackspaces } from '../utils'

const ChannelTypeLive_QQ = 10005

export class Channel {
  static VALID_TYPES = [Universal.Channel.Type.TEXT, Universal.Channel.Type.VOICE, ChannelTypeLive_QQ] // 只支持文字、音视频子频道
  readonly id: string
  readonly guildId: string
  name: string
  type: Universal.Channel.Type

  lastSession?: Session // 子频道最新一条消息
  private readonly bot: Bot

  constructor(bot: Bot, id: string, guildId: string, name: string | undefined, type: Universal.Channel.Type) {
    makeAutoObservable(this)
    this.bot = bot
    this.id = id
    this.guildId = guildId
    this.name = name || id
    this.type = type
  }

  // 发消息到该子频道
  async sendMessage(content: string, session?: Session, recordLog = true) {
    // 如没有指定发某条被动消息，则尝试尽量发被动
    if (!session) {
      session = this.getLastSessionForReply()
    }
    // 如果发送文字消息，则对文字消息做 trim。因为 qq 除 android 端都会自动 trim，为了保证结果在各个平台展示的一致性，此处先统一做 trim
    // 同时人肉对 \b 做下处理，支持退格，以应对自定义回复拼接时用户需要自定义的极端情况
    if (content) {
      content = removeBackspaces(content.trim())
    }
    try {
      // console.time('message')
      const res = await this.bot.api.sendMessage(this.id, content, this.guildId, { session })
      const messageId = res.at(-1)!
      // console.timeEnd('message')
      console.log('[Message] 发送成功 ' + content)
      if (recordLog) {
        this.sendLogAsync(messageId, content)
      }
      return { id: messageId, content }
    } catch (e) {
      console.error('[Message] 发送失败', e)
      return null
    }
  }

  async sendRawImageMessage(...args: any[]) {
    console.warn('sendRawImageMessage not implemented yet')
    return null
  }

  // 记录 log
  private async sendLogAsync(msgId: string, content: string) {
    // 如有 content，说明是文本消息，直接推
    if (content) {
      this.bot.logs.pushToClients(this.guildId, this.id, {
        msgId,
        msgType: 'text',
        userId: this.bot.botInfo?.id || '',
        username: this.bot.botInfo?.username || '',
        content,
        timestamp: String(Date.now())
      })
      return
    }
    // 没 content 的情况，是图片，获取不到转存后的图片地址，需要单独请求下
    // try {
    //   const resp = await this.api.qqClient.messageApi.message(this.id, msgResp.id)
    //   const detailMsg = resp.data.message
    //   let fetchedContent: string = detailMsg.content
    //   let msgType: MessageType = 'text'
    //   if (detailMsg.attachments?.[0]?.url) {
    //     fetchedContent = detailMsg.attachments[0].url
    //     msgType = 'image'
    //   }
    //   if (!fetchedContent) {
    //     fetchedContent = '消息为空或暂不支持'
    //   }
    //   this.api.logs.pushToClients(this.guildId, this.id, {
    //     msgId: msgResp.id,
    //     msgType: msgType,
    //     userId: this.api.botInfo?.id || '',
    //     username: this.api.botInfo?.username || '',
    //     content: fetchedContent,
    //     timestamp: msgResp.timestamp
    //   })
    // } catch (e) {
    //   console.error('[Message] 获取消息详情失败', e)
    // }
  }

  // 获取可用于回复的被动消息 id
  private getLastSessionForReply() {
    const lastMsgTime = this.lastSession?.timestamp ? new Date(this.lastSession.timestamp).getTime() : 0
    const currentTime = new Date().getTime()
    // 判断有没有超过被动消息有效期
    if (currentTime - lastMsgTime <= 5 * 60 * 1000 - 2000) {
      console.log('[Message] 命中被动消息缓存')
      return this.lastSession
    } else {
      this.lastSession = undefined
      return undefined
    }
  }
}

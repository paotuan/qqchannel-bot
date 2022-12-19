import type { QApi } from './index'
import { makeAutoObservable } from 'mobx'
import { AvailableIntentsEventsEnum, IMessage, MessageToCreate } from 'qq-guild-bot'
import * as FormData from 'form-data'
import fetch from 'node-fetch'
import type {
  INoteFetchReq,
  INoteSendReq,
  INoteSendResp,
  INoteSyncResp,
  INote,
  INoteFetchResp,
  INoteDeleteReq, MessageType
} from '../../../interface/common'
import type { WsClient } from '../../app/wsclient'

export class NoteManager {
  private readonly api: QApi
  private get wss() { return this.api.wss }
  private lastChannelMessageMap: Record<string, IMessage> = {} // channelId => channel 最后一条消息

  constructor(api: QApi) {
    makeAutoObservable<this, 'api' | 'wss'>(this, { api: false, wss: false })
    this.api = api
    this.initListeners()
  }

  private initListeners() {
    this.api.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
      // 保存每个子频道的最后一条消息，用于发被动
      // 这里不根据 listeningChannels 过滤，虽然多占用了一点空间，但是多开场景可以增加发送成功的概率
      const msg = data.msg as IMessage
      const channel = msg.channel_id
      this.lastChannelMessageMap[channel] = msg
    })
  }

  async sendNote(client: WsClient, req: INoteSendReq) {
    const guildId = client.listenToGuildId
    const channelId = client.listenToChannelId
    try {
      const msgToCreate: MessageToCreate = {
        msg_id: this.getLastChannelMessageId(channelId),
        content: req.msgType === 'text' ? req.content : undefined,
        image: req.msgType === 'image' ? req.content : undefined
      }
      // 1. 发消息
      const resp = await this.api.qqClient.messageApi.postMessage(channelId, msgToCreate)
      // 2. 发消息成功后记录 log
      const msgId = resp.data.id
      this.sendLogAsync(guildId, channelId, msgId, req.content, resp.data.timestamp)
      // 3. 设为精华消息
      const { data } = await this.api.qqClient.pinsMessageApi.putPinsMessage(channelId, msgId)
      console.log('[Note] 发送成功', req.content)
      // 4. 返回成功结果
      this.api.wss.sendToChannel<INoteSendResp>(channelId, {
        cmd: 'note/send',
        success: true,
        data: { allNoteIds: data.message_ids, msgType: req.msgType }
      })
    } catch (e: any) {
      console.error('[Note] 发送失败', e)
      this.api.wss.sendToClient<string>(client, { cmd: 'note/send', success: false, data: `发送失败 ${e?.code || ''}` })
    }
  }

  async sendRawImage(client: WsClient, img: Buffer) {
    const guildId = client.listenToGuildId
    const channelId = client.listenToChannelId
    try {
      const formData = new FormData()
      formData.append('msg_id', this.getLastChannelMessageId(channelId))
      formData.append('file_image', img, 'test.png') // 名字必须有以获取正确的 content-type, 但只要是图片就行
      // 1. 发消息
      const res = await fetch(`https://api.sgroup.qq.com/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': formData.getHeaders()['content-type'],
          'Authorization': `Bot ${this.api.appid}.${this.api.token}`
        },
        body: formData
      })
      const resp = await res.json() as IMessage
      // 2. 发消息成功后记录 log
      const msgId = resp.id
      this.sendLogAsync(guildId, channelId, msgId)
      // 3. 设为精华消息
      const { data } = await this.api.qqClient.pinsMessageApi.putPinsMessage(channelId, msgId)
      console.log('[Note] 发送成功 本地图片')
      // 4. 返回成功结果
      this.api.wss.sendToChannel<INoteSendResp>(channelId, {
        cmd: 'note/send',
        success: true,
        data: { allNoteIds: data.message_ids, msgType: 'image' } // 发图片返回的 res 没有图片链接，干脆只返回所有 id 去同步
      })
    } catch (e: any) {
      console.error('[Note] 发送本地图片失败', e)
      this.api.wss.sendToClient<string>(client, { cmd: 'note/send', success: false, data: `发送失败 ${e?.code || ''}` })
    }
  }

  async syncNotes(client: WsClient) {
    const channel = client.listenToChannelId
    try {
      const { data } = await this.api.qqClient.pinsMessageApi.pinsMessage(channel)
      console.log('[Note] 同步成功')
      this.api.wss.sendToClient<INoteSyncResp>(client, { cmd: 'note/sync', success: true, data: { allNoteIds: data.message_ids } })
    } catch (e: any) {
      console.error('[Note] 同步失败', e)
      this.api.wss.sendToClient<string>(client, { cmd: 'note/sync', success: false, data: `同步失败 ${e?.code || ''}` })
    }
  }

  async fetchNotes(client: WsClient, req: INoteFetchReq) {
    const channel = client.listenToChannelId
    try {
      const requests = req.allNoteIds.map(msgId => this.api.qqClient.messageApi.message(channel, msgId))
      const resps = await Promise.all(requests)
      console.log('[Note] 获取成功', req.allNoteIds)
      this.api.wss.sendToClient<INoteFetchResp>(client, {
        cmd: 'note/fetch',
        success: true,
        data: resps.map((resp, i) => {
          const msg = resp.data.message
          let content: string = msg.content
          let msgType = 'text'
          // 判断是否是图片
          // 测试下来目前只支持图片。其他类型会直接变成 '当前版本不支持查看，请升级QQ版本'。图文混排支持也很有限，因此这里只考虑图片和文字两种情况
          if (msg.attachments?.[0]?.url) {
            content = msg.attachments[0].url
            msgType = 'image'
          }
          if (!content) {
            content = '消息为空或暂不支持'
          }
          // 不知为何接口返回的消息id 是长 id ‘08e9f7e796f08fc84510d6a2a5051a1231343431313532313837313337383039343520801e2800308bdca3dc03382b402b48c19e859906’
          // 其他地方的都是短 id '08dcbc8fa19cf9cbd9b60110d6a2a505382b48c59f859906'，因此这里返回时也取短 id
          return { msgId: req.allNoteIds[i], msgType, content } as INote
        })
      })
    } catch (e: any) {
      console.error('[Note] 获取失败', e)
      this.api.wss.sendToClient<string>(client, { cmd: 'note/fetch', success: false, data: `Note 获取失败 ${e?.code || ''}` })
    }
  }

  async deleteNote(client: WsClient, req: INoteDeleteReq) {
    const channel = client.listenToChannelId
    try {
      await this.api.qqClient.pinsMessageApi.deletePinsMessage(channel, req.id)
      console.log('[Note] 取消精华成功')
    } catch (e) {
      console.error('[Note] 取消精华失败', e)
    }
  }

  // 获取频道最新一条消息，用于发被动
  private getLastChannelMessageId(channelId: string) {
    const lastChannelMessage = this.lastChannelMessageMap[channelId]
    const lastMsgTime = lastChannelMessage ? new Date(lastChannelMessage.timestamp).getTime() : 0
    const currentTime = new Date().getTime()
    // 判断有没有超过被动消息有效期
    if (currentTime - lastMsgTime <= 5 * 60 * 1000 - 2000) {
      console.log('[Note] 发送被动消息')
      return lastChannelMessage?.id
    } else {
      delete this.lastChannelMessageMap[channelId]
      console.log('[Note] 发送主动消息 暂不支持')
      // todo 暂时屏蔽发主动消息，省的处理审核那一坨东西
      throw { code: '频道不活跃' }
    }
  }

  // 机器人自己发的消息异步推送 log
  private async sendLogAsync(guildId: string, channelId: string, msgId: string, content?: string, timestamp?: string) {
    // 文字可以直接有 content, 直接 push
    if (content) {
      this.api.logs.pushToClients(guildId, channelId, {
        msgId: msgId,
        msgType: 'text',
        userId: this.api.botInfo?.id || '',
        username: this.api.botInfo?.username || '',
        content: content,
        timestamp: timestamp!
      })
    }
    try {
      // 没 content 的情况，是图片，获取不到转存后的图片地址，需要单独请求下
      const resp = await this.api.qqClient.messageApi.message(channelId, msgId)
      const msg = resp.data.message
      let fetchedContent: string = msg.content
      let msgType: MessageType = 'text'
      if (msg.attachments?.[0]?.url) {
        fetchedContent = msg.attachments[0].url
        msgType = 'image'
      }
      if (!fetchedContent) {
        fetchedContent = '消息为空或暂不支持'
      }
      this.api.logs.pushToClients(guildId, channelId, {
        msgId: msgId,
        msgType: msgType,
        userId: this.api.botInfo?.id || '',
        username: this.api.botInfo?.username || '',
        content: fetchedContent,
        timestamp: msg.timestamp
      })
    } catch (e) {
      console.error('[Note] 获取消息详情失败', e)
    }
  }
}

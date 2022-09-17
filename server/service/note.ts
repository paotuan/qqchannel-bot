import qqApi from '../qqApi'
import { AvailableIntentsEventsEnum, IMessage, MessageToCreate } from 'qq-guild-bot'
import config from './common'
import wss from '../wss'
import type {
  INoteSendReq,
  INoteSendResp,
  INoteSyncResp,
  IListenToChannelReq,
  ILogPushResp,
  INoteFetchReq, INoteFetchResp, INote, INoteDeleteReq
} from '../../interface/common'

// 保留该频道的最后一条消息，用于尽可能发被动消息，不消耗配额
let lastChannelMessage: IMessage | null = null
qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
  const msg = data.msg as IMessage
  // 无视未监听的频道消息
  const channel = msg.channel_id
  if (channel !== config.listenToChannelId) return
  lastChannelMessage = msg
})

// 若切换监听频道，将 lastMessage 置空
wss.on('channel/listen', (ws, data) => {
  const { channelId } = data as IListenToChannelReq
  if (lastChannelMessage?.channel_id !== channelId) {
    lastChannelMessage = null
  }
})

// 发送重要笔记
wss.on('note/send', async (ws, data) => {
  const req = data as INoteSendReq
  const channel = config.listenToChannelId
  const msgToCreate: MessageToCreate = { content: req.content }

  try {
    const lastMsgTime = lastChannelMessage ? new Date(lastChannelMessage.timestamp).getTime() : 0
    const currentTime = new Date().getTime()
    // 判断有没有超过被动消息有效期
    if (currentTime - lastMsgTime <= 5 * 60 * 1000 - 2000) {
      msgToCreate.msg_id = lastChannelMessage?.id
      console.log('[Note] 发送被动消息')
    } else {
      lastChannelMessage = null
      console.log('[Note] 发送主动消息 暂不支持')
      // todo 暂时屏蔽发主动消息，省的处理审核那一坨东西
      throw { code: '频道不活跃' }
    }
    // 1. 发消息
    const resp = await qqApi.client.messageApi.postMessage(channel, msgToCreate)
    // 2. 发消息成功后记录 log
    const msgId = resp.data.id
    wss.send<ILogPushResp>(null, {
      cmd: 'log/push',
      success: true,
      data: [{
        msgId: msgId,
        msgType: req.msgType,
        userId: qqApi.botInfo?.id || '',
        username: qqApi.botInfo?.username || '',
        content: req.content,
        timestamp: resp.data.timestamp
      }]
    })
    // 3. 设为精华消息
    const { data } = await qqApi.client.pinsMessageApi.putPinsMessage(channel, msgId)
    console.log('[Note] 发送成功', req.content)
    // 4. 返回成功结果
    wss.send<INoteSendResp>(ws, {
      cmd: 'note/send',
      success: true,
      data: { note: { ...req, msgId }, allNoteIds: data.message_ids }
    })
  } catch (e: any) {
    console.log('[Note] 发送失败', e)
    wss.send<string>(ws, { cmd: 'note/send', success: false, data: `发送失败 ${e?.code || ''}` })
  }
})

// 同步重要笔记
wss.on('note/sync', async (ws) => {
  const channel = config.listenToChannelId
  try {
    const { data } = await qqApi.client.pinsMessageApi.pinsMessage(channel)
    console.log('[Note] 同步成功')
    wss.send<INoteSyncResp>(ws, { cmd: 'note/sync', success: true, data: { allNoteIds: data.message_ids } })
  } catch (e: any) {
    console.log('[Note] 同步失败', e)
    wss.send<string>(ws, { cmd: 'note/sync', success: false, data: `同步失败 ${e?.code || ''}` })
  }
})

// 获取笔记内容
wss.on('note/fetch', async (ws, data) => {
  const req = data as INoteFetchReq
  const channel = config.listenToChannelId
  try {
    const requests = req.allNoteIds.map(msgId => qqApi.client.messageApi.message(channel, msgId))
    const resps = await Promise.all(requests)
    console.log('[Note] 获取成功', req.allNoteIds)
    wss.send<INoteFetchResp>(ws, {
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
    console.log('[Note] 获取失败', e)
    wss.send<string>(ws, { cmd: 'note/fetch', success: false, data: `Note 获取失败 ${e?.code || ''}` })
  }
})

// 取消精华消息
wss.on('note/delete', async (ws, data) => {
  const { id } = data as INoteDeleteReq
  const channel = config.listenToChannelId
  try {
    await qqApi.client.pinsMessageApi.deletePinsMessage(channel, id)
    console.log('[Note] 取消精华成功')
  } catch (e) {
    console.log('[Note] 取消精华失败', e)
  }
})

import { Bot } from './Bot'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { IBotConfig_QQ } from '@paotuan/types'

// 有些 api 仅在 qq 频道 v1 api 下可用

function baseUrl(bot: Bot) {
  if ((bot.config as IBotConfig_QQ).sandbox) {
    return 'https://sandbox.api.sgroup.qq.com'
  } else {
    return 'https://api.sgroup.qq.com'
  }
}

export async function qqguildV1_getMessageContent(bot: Bot, channelId: string, msgId: string) {
  try {
    const res = await fetch(`${baseUrl(bot)}/channels/${channelId}/messages/${msgId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${bot.config.appid}.${bot.config.token}`
      }
    })
    const resp = await res.json()
    return resp.message.content
  } catch (e) {
    console.log(e)
    return ''
  }
}

export async function qqguildV1_sendRawImage(bot: Bot, channelId: string, imgData: string, replyMsgId?: string) {
  const formData = new FormData()
  if (replyMsgId) formData.append('msg_id', replyMsgId)
  // 根据 base64 解出 img buffer
  // https://stackoverflow.com/questions/11335460/how-do-i-parse-a-data-url-in-node
  const img = Buffer.from(imgData.split(',')[1], 'base64')
  formData.append('file_image', img, 'test.png') // 名字必须有以获取正确的 content-type, 但只要是图片就行
  // 1. 发消息
  const res = await fetch(`${baseUrl(bot)}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': formData.getHeaders()['content-type'],
      'Authorization': `Bot ${bot.config.appid}.${bot.config.token}`
    },
    body: formData
  })
  const resp = await res.json()
  // 返回消息 id
  return resp.id as string
}

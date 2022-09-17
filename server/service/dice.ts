import qqApi from '../qqApi'
import { AvailableIntentsEventsEnum, IMessage } from 'qq-guild-bot'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import config from './common'
import wss from '../wss'
import { ILogPushResp } from '../../interface/common'

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
  const msg = data.msg as IMessage
  // 无视未监听的频道消息
  const channel = msg.channel_id
  if (channel !== config.listenToChannelId) return

  // 无视非文本消息
  const content = msg.content?.trim()
  if (!content) return

  // 提取出指令体，无视非指令消息
  const botUserId = qqApi.botInfo?.id
  let fullExp = '' // .d100 困难侦察
  if (content.startsWith(`<@!${botUserId}> `)) {
    // @机器人的消息
    fullExp = content.replace(`<@!${botUserId}> `, '').trim()
  } else if (content.startsWith('.') || content.startsWith('。')) {
    // 指令消息
    fullExp = content.substring(1)
  }
  if (!fullExp) return

  const msg_id = msg.id
  const nickname = msg.member.nick

  try {
    const [exp, desc = ''] = fullExp.split(/\s+/, 1) // 第一个元素是 at消息体，无视之
    const roll = new DiceRoll(exp)
    // 返回结果
    const reply = `${nickname} 🎲 ${desc} ${roll.output}`
    qqApi.client.messageApi.postMessage(channel, { content: reply, msg_id }).then((res) => {
      console.log('[Dice] 发送成功 ' + reply)
      // 自己发的消息要记录 log
      wss.send<ILogPushResp>(null, {
        cmd: 'log/push',
        success: true,
        data: [{
          msgId: res.data.id,
          msgType: 'text',
          userId: qqApi.botInfo?.id || '',
          username: qqApi.botInfo?.username || '',
          content: reply,
          timestamp: res.data.timestamp
        }]
      })
    }).catch((err) => {
      console.log(err)
    })
  } catch (e) {
    // 表达式不合法，无视之
  }
})

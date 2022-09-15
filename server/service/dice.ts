import qqApi from '../qqApi'
import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
  const content = data.msg.content
  const channel = data.msg.channel_id
  const msg_id = data.msg.id
  const nickname = data.msg.member.nick

  try {
    const [, exp, ...desc] = content.split(/\s+/) // 第一个元素是 at消息体，无视之
    const roll = new DiceRoll(exp)
    // 返回结果
    const reply = `${nickname} 🎲 ${desc.join(' ')} ${roll.output}`
    qqApi.client.messageApi.postMessage(channel, { content: reply, msg_id }).then((res) => {
      console.log(res.data)
    }).catch((err) => {
      console.log(err)
    })
  } catch (e) {
    // 表达式不合法，无视之
  }
})

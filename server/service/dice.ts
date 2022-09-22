import qqApi from '../qqApi'
import { AvailableIntentsEventsEnum, IMessage } from 'qq-guild-bot'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import config from './common'
import wss from '../wss'
import type { ICardTestResp, ILogPushResp } from '../../interface/common'
import { cardStore } from './card'

// 缓存最近5分钟的消息 todo 后面独立出去
interface IMessageCache {
  id: string
  timestamp: number
  text?: string // 文本消息才有
  skill?: string | null // 文本消息是否包含技能或属性。第一次使用时解析（undefined: 未解析，null：解析了但是为空）
}

const _recentMessages: IMessageCache[] = []

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
  const msg = data.msg as IMessage
  // 无视未监听的频道消息
  const channel = msg.channel_id
  if (channel !== config.listenToChannelId) return

  // 最近消息缓存

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
    const [exp, desc = ''] = parseFullExp(fullExp)
    console.log(fullExp, exp, desc)
    const roll = new DiceRoll(exp)
    // 判断成功等级
    const result = decideResult(msg.author.id, desc, roll.total)
    if (result?.resultDesc?.endsWith('成功')) {
      // 成功的技能检定返回客户端。这么判断有点丑陋不过先这样吧
      // todo 推送给同一个子频道的端
      wss.send<ICardTestResp>(null, {
        cmd: 'card/test',
        success: true,
        data: { cardName: result!.cardName, success: true, propOrSkill: result!.skill }
      })
    }
    // 返回结果
    const reply = `${nickname} 🎲 ${desc} ${roll.output} ${result?.resultDesc || ''}`
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

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (data: any) => {
  console.log(data) // 似乎没有暴露类型定义
  // 无视未监听的频道消息
  const channel = data.msg.channel_id
  if (channel !== config.listenToChannelId) return

})

// 提取指令为 [骰子表达式, 描述]
function parseFullExp(fullExp: string): [string, string] {
  // sc 简写
  if (fullExp === 'sc' || fullExp === 'SC') {
    return ['d%', 'sc']
  }
  const index = fullExp.search(/[\p{Unified_Ideograph}\s]/u) // 按第一个中文或空格分割
  const [exp, desc = ''] = index < 0 ? [fullExp] : [fullExp.slice(0, index), fullExp.slice(index)]
  // 兼容一些其他指令
  if (exp === 'd' || exp === 'r' || exp === 'rd') {
    return ['d%', desc] // 默认骰，目前写死是 d100
  } else if (exp === 'ra') {
    return ['d%', desc] // coc 技能骰
  } else if (exp.startsWith('r')) {
    return [exp.slice(1), desc] // rd100 => d100
  } else {
    return [exp, desc]
  }
}

function decideResult(sender: string, desc: string, roll: number) {
  let skill = desc.trim()
  let resultDesc = ''
  // 0. 判断有没有描述
  if (!skill) return null
  // 1. 判断有没有人物卡
  const cardName = cardStore.linkMap[sender]
  const card = cardName ? cardStore.cardMap[cardName] : null
  if (!card) return null
  // 2. 判断有没有对应的技能
  //   2.1 先判断几个特殊的
  if (skill === '理智' || skill === 'sc' || skill === 'SC') {
    resultDesc = roll <= card.basic.san ? `≤ ${card.basic.san} 成功` : `> ${card.basic.san} 失败`
  } else if (skill === '幸运') {
    resultDesc = roll <= card.basic.luck ? `≤ ${card.basic.luck} 成功` : `> ${card.basic.luck} 失败`
  } else if (skill === '灵感') {
    resultDesc = roll <= card.props['智力'] ? `≤ ${card.props['智力']} 成功` : `> ${card.props['智力']} 失败`
  } else {
    //   2.2 判断难度等级
    const isHard = skill.indexOf('困难') >= 0
    const isEx = skill.indexOf('极难') >= 0 || skill.indexOf('极限') >= 0
    skill = skill.replace(/(困难|极难|极限)/g, '')
    if (skill === '侦查') skill = '侦察' // 人物卡模版里的是后者
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let target = card.props[skill] || card.skills[skill]
    if (!target) return null // 没有技能。技能值为 0 应该也不可能
    // 3. 判断大成功大失败
    if (roll === 1) {
      resultDesc = '大成功'
    } else if (roll > 95) {
      resultDesc = '大失败'
    } else {
      // 4. 真实比较
      target = isEx ? Math.floor(target / 5) : (isHard ? Math.floor(target / 2) : target)
      resultDesc = roll <= target ? `≤ ${target} 成功` : `> ${target} 失败`
    }
  }
  // extra. 如果技能成功了，返回成功的技能名字，用来给前端自动高亮
  return { resultDesc, skill, cardName }
}

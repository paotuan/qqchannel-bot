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
  instruction?: string | null // 文本消息是否包含指令。第一次使用时解析（undefined: 未解析，null：解析了但是为空）
}

let _recentMessages: IMessageCache[] = []

// 获取最近消息
function getRecentMessages() {
  // 过滤掉超过5分钟的消息
  const lastExpiredMsgIndex = (() => {
    const now = Date.now()
    for (let i = 0; i < _recentMessages.length; i++) {
      if (now - _recentMessages[i].timestamp <= 5 * 60 * 1000 - 2000) {
        return i
      }
    }
    return _recentMessages.length
  })()
  _recentMessages = _recentMessages.slice(lastExpiredMsgIndex)
  return _recentMessages
}

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data: any) => {
  const msg = data.msg as IMessage
  // 无视未监听的频道消息
  const channel = msg.channel_id
  if (channel !== config.listenToChannelId) return

  // 最近消息缓存
  _recentMessages.push({
    id: msg.id,
    timestamp: new Date(msg.timestamp).getTime(),
    text: msg.content?.trim()
  })

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
  // 投骰
  tryRollDice(fullExp, msg.author.id, msg.member.nick, msg.id)
})

qqApi.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (data: any) => {
  // console.log(data) // 似乎没有暴露类型定义
  // 无视未监听的频道消息
  const channel = data.msg.channel_id
  if (channel !== config.listenToChannelId) return
  // 无视取消表情
  if (data.eventType === 'MESSAGE_REACTION_REMOVE') return
  // 找到表情对应的消息
  const msgId = data.msg.target.id as string
  const msgCache = getRecentMessages()
  const sourceMsg = msgCache.find(msg => msg.id === msgId)
  if (!sourceMsg || !sourceMsg.text) return // 消息过期了或不是文本消息，无视
  if (typeof sourceMsg.instruction === 'undefined') {
    sourceMsg.instruction = detectInstruction(sourceMsg.text) // 第一次解析
  }
  if (!sourceMsg.instruction) return // 不存在指令
  // 可以发消息，找到发消息人对应的昵称
  const userId = data.msg.user_id as string
  const user = qqApi.userList.find(user => user.id === userId)
  const nickname = user?.nick || userId
  tryRollDice(`d% ${sourceMsg.instruction}`, userId, nickname, sourceMsg.id)
})

/**
 * 投骰
 * @param fullExp 指令表达式
 * @param userId 用户 id
 * @param nickname 用户昵称
 * @param msgId 被动消息 id
 */
function tryRollDice(fullExp: string, userId: string, nickname: string, msgId: string) {
  try {
    const [exp, desc = ''] = parseFullExp(fullExp)
    console.log(fullExp, exp, desc)
    const roll = new DiceRoll(exp)
    // 判断成功等级
    const result = decideResult(userId, desc, roll.total)
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
    qqApi.client.messageApi.postMessage(config.listenToChannelId, { content: reply, msg_id: msgId }).then((res) => {
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
}

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

const instRegex = new RegExp('(力量|体质|体型|敏捷|外貌|智力|灵感|意志|教育|理智|幸运|会计|人类学|估价|考古学|魅惑|攀爬|计算机|信用|克苏鲁神话|乔装|闪避|驾驶|电气维修|电子学|话术|格斗|射击|急救|历史|恐吓|跳跃|母语|法律|图书馆|聆听|锁匠|机械维修|医学|博物学|领航|神秘学|重型机械|说服|精神分析|心理学|骑术|妙手|侦查|侦察|潜行|游泳|投掷|追踪|sc|SC)', 'g')

// 判断文本中有没有包含指令
function detectInstruction(text: string) {
  const skillMatch = text.match(instRegex)
  if (!skillMatch) return null
  const skill = skillMatch[0]
  const difficultyMatch = text.match(/(困难|极难|极限)/)
  const difficulty = difficultyMatch ? difficultyMatch[0] : ''
  return difficulty + skill
}

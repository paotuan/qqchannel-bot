/* eslint-env node */

const handled = Symbol('qfq_triggered')

const regexCache = {}
const getRegex = pattern => {
  if (regexCache[pattern]) {
    return regexCache[pattern]
  }
  return regexCache[pattern] = new RegExp(`^${pattern}`)
}

// 人物卡记录是否处于潜伏期
const QFQ_FIELD = 'qfq'
// 是否是潜伏期理智损失造成的疯狂掷骰
const IS_QFQ_CAUSED_TI = 'is_qfq_caused_ti'

module.exports = ({ sendMessageToChannel, getPreference, render, dispatchUserCommand, getCard, saveCard, _ }) => {
  const scBroadcastMessageIds = [] // 保存理智损失播报的消息 id

  return {
    id: 'io.paotuan.plugin.qfq',
    name: '疯狂潜伏期',
    description: '当调查员疯狂后，自动进行 1d10 的潜伏期掷骰\n当潜伏期内产生理智损失，进行播报\n.qfq - 消除潜伏期标记',
    version: 1,
    preference: [
      {
        key: 'triggerRoll',
        label: '触发潜伏期掷骰指令前缀',
        defaultValue: 'ti|li'
      },
      {
        key: 'expression',
        label: '潜伏期掷骰表达式',
        defaultValue: '1d10潜伏期'
      },
      {
        key: 'broadcast',
        label: '潜伏期内理智损失播报',
        defaultValue: '{{人物卡名}} 疯狂发作结束后，精神正处于脆弱状态，任何进一步的理智损失（即使只有1点）都会导致再度疯狂发作！'
      },
      {
        key: 'ti',
        label: '临时疯狂指令',
        defaultValue: 'ti'
      },
      {
        key: 'reset',
        label: '消除潜伏期标记',
        defaultValue: '{{人物卡名}} 已消除潜伏期标记'
      }
    ],
    hook: {
      onReceiveCommand: [
        {
          id: 'triggerRoll',
          name: '疯狂后，触发潜伏期掷骰和潜伏期标记',
          handler: result => {
            // 只处理一次
            if (result[handled]) {
              return false
            }
            result[handled] = true
            // 是否本来就是潜伏期内损失理智引起的，无需处理
            if (result[IS_QFQ_CAUSED_TI]) {
              return false
            }
            // 是否是疯狂掷骰
            const pattern = getPreference(result.context).triggerRoll
            const regex = getRegex(pattern)
            const matchResult = result.command.match(regex)
            if (matchResult) {
              // 触发潜伏期掷骰
              setTimeout(() => {
                const command = getPreference(result.context).expression
                dispatchUserCommand({ command, context: _.cloneDeep(result.context) })
              }, 200)
              // 若有人物卡，则标记该人物处于潜伏期
              const card = getCard(result.context)
              if (card && card.type === 'coc') {
                card.data.meta[QFQ_FIELD] = true
                saveCard(card)
              }
            }

            return false
          }
        }
      ],
      onCardEntryChange: [
        {
          id: 'broadcast',
          name: '潜伏期内的理智损失播报',
          handler: ({ event, context }) => {
            // 是否是 san值损失
            if (event.card.type !== 'coc') return
            if (event.key !== 'SAN') return
            if (typeof event.value !== 'number') return
            if (typeof event.oldValue !== 'number') return
            const loss = event.oldValue - event.value
            if (loss <= 0) return
            // 是否处于潜伏期内
            const isQfq = !!event.card.data.meta[QFQ_FIELD]
            if (!isQfq) return
            // 发送播报
            const env = {
              ...context,
              用户名: context.username,
              人物卡名: event.card.name,
              at用户: `<@!${context.userId}>`
            }
            setTimeout(async () => {
              const text = getPreference(context).broadcast
              const resp = await sendMessageToChannel(env, render(text, env), { skipParse: true })
              if (resp && resp.id) {
                scBroadcastMessageIds.push(resp.id)
              }
            }, 200)
          }
        }
      ],
      onMessageReaction: [
        {
          id: 'rollti',
          name: '潜伏期内损失理智，触发临时疯狂',
          handler: ({ context }) => {
            const msgId = context.replyMsgId
            if (scBroadcastMessageIds.includes(msgId)) {
              const command = getPreference(context).ti
              dispatchUserCommand({ command, context, [IS_QFQ_CAUSED_TI]: true })
              return true
            }
            return false
          }
        }
      ]
    },
    customReply: [
      {
        id: 'reset',
        name: '消除潜伏期标记',
        description: '/qfq 消除潜伏期标记',
        command: /^\s*qfq/.source,
        trigger: 'regex',
        handler: (env) => {
          const card = getCard(env)
          if (!card || card.type !== 'coc') {
            return '当前用户未关联 COC 人物卡'
          }
          card.data.meta[QFQ_FIELD] = false
          saveCard(card)

          const text = getPreference(env).reset
          return render(text, env)
        }
      }
    ]
  }
}

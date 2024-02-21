/* eslint-env node */

// 人物卡记录疯狂线字段名
const FKX_FIELD = 'fkx'
// 是否已经播报
const FKX_BROADCAST = 'fkx_broadcast'

module.exports = ({ sendMessageToChannel, getPreference, render, getCard, saveCard, dispatchUserCommand }) => {
  const fkxBroadcastMessageIds = [] // 保存疯狂线播报的消息 id

  return {
    id: 'io.paotuan.plugin.fkx',
    name: '不定性疯狂线',
    description: '当调查员一日内损失 20% 的理智后，就会陷入不定性疯狂，得到休息或放松后可以重置这个界限。\n当理智损失超过疯狂线后，进行一次播报\n.fkx - 重置疯狂线为当前理智的 80%',
    version: 1,
    preference: [
      {
        key: 'triggered',
        label: '触发疯狂线',
        defaultValue: '{{人物卡名}} 的理智损失已经等于或高于当日理智的20%，即将陷入不定性疯狂！'
      },
      {
        key: 'reset',
        label: '重置疯狂线',
        defaultValue: '{{人物卡名}} 的疯狂线已重置为 {{理智值}}x0.8 = {{疯狂线}}'
      },
      {
        key: 'ti',
        label: '临时疯狂指令',
        defaultValue: 'ti'
      }
    ],
    hook: {
      onCardEntryChange: [
        {
          id: 'x',
          name: '触发疯狂线播报',
          handler: ({ event, context }) => {
            if (event.card.type !== 'coc') return
            if (event.key !== 'SAN') return
            if (typeof event.value !== 'number') return
            if (typeof event.oldValue !== 'number') return
            const loss = event.oldValue - event.value
            if (loss <= 0) return

            const card = event.card
            // 判断是否有已有的疯狂线
            let fkx = card.data.meta[FKX_FIELD]
            // 如果没有疯狂线，则计算一次
            if (typeof fkx !== 'number') {
              fkx = getFkx(event.oldValue)
              card.data.meta[FKX_FIELD] = fkx
              saveCard(card)
            }
            // 是否已经播报过
            const alreadyBroadcast = !!card.data.meta[FKX_BROADCAST]
            if (alreadyBroadcast) return

            // 判断是否越过了疯狂线
            if (event.value <= fkx) {
              card.data.meta[FKX_BROADCAST] = true
              saveCard(card)

              setTimeout(async () => {
                const env = {
                  ...context,
                  nick: context.username, // 兼容处理，后面看是否可以合并
                  用户名: context.username,
                  人物卡名: event.card.name,
                  at用户: `<@!${context.userId}>`
                }
                const text = getPreference(context).triggered
                const resp = await sendMessageToChannel(env, render(text, env), { skipParse: true })
                if (resp && resp.id) {
                  fkxBroadcastMessageIds.push(resp.id)
                }
              }, 500)
            }
          }
        }
      ],
      onMessageReaction: [
        {
          id: 'rollti',
          name: '触发疯狂线播报后，掷临时疯狂症状',
          handler: ({ context }) => {
            const msgId = context.replyMsgId
            if (fkxBroadcastMessageIds.includes(msgId)) {
              const command = getPreference(context).ti
              dispatchUserCommand({ command, context })
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
        name: '重置疯狂线',
        description: '/fkx 重置疯狂线为当前理智 *0.8',
        command: /^\s*fkx/.source,
        trigger: 'regex',
        handler: (env) => {
          const card = getCard(env)
          if (!card || card.type !== 'coc') {
            return '当前用户未关联 COC 人物卡'
          }
          const fkx = getFkx(card.SAN)
          card.data.meta[FKX_FIELD] = fkx
          card.data.meta[FKX_BROADCAST] = false
          saveCard(card)

          const text = getPreference(env).reset
          const formatArgs = { ...env, 理智值: card.SAN, 疯狂线: fkx }
          return render(text, formatArgs)
        }
      }
    ]
  }
}

// 计算疯狂线
function getFkx(value) {
  return Math.floor(value * 0.8)
}

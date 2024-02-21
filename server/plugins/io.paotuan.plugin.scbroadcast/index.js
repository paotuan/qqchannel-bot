/* eslint-env node */

module.exports = ({ sendMessageToChannel, getPreference, render, dispatchUserCommand }) => {
  const scBroadcastMessageIds = [] // 保存理智损失播报的消息 id

  return {
    id: 'io.paotuan.plugin.scbroadcast',
    name: '理智损失播报',
    description: '当理智损失 5 点或更多时，进行一次播报。表情回复播报消息，进行一次智力检定。',
    version: 1,
    preference: [
      {
        key: 'text',
        label: '提示语',
        defaultValue: '{{人物卡名}} 损失了等于或高于5点理智，即将陷入临时性/总结性疯狂！'
      },
    ],
    hook: {
      onCardEntryChange: [
        {
          id: 'x',
          name: '理智损失播报',
          handler: ({ event, context }) => {
            if (event.card.type !== 'coc') return
            if (event.key !== 'SAN') return
            if (typeof event.value !== 'number') return
            if (typeof event.oldValue !== 'number') return
            const loss = event.oldValue - event.value
            if (loss >= 5) {
              const env = {
                ...context,
                nick: context.username, // 兼容处理，后面看是否可以合并
                用户名: context.username,
                人物卡名: event.card.name,
                at用户: `<@!${context.userId}>`
              }
              setTimeout(async () => {
                const text = getPreference(context).text
                const resp = await sendMessageToChannel(env, render(text, env), { skipParse: true })
                if (resp && resp.id) {
                  scBroadcastMessageIds.push(resp.id)
                }
              }, 500)
            }
          }
        }
      ],
      onMessageReaction: [
        {
          id: 'rollint',
          name: '理智损失播报后，进行智力检定',
          handler: ({ context }) => {
            const msgId = context.replyMsgId
            if (scBroadcastMessageIds.includes(msgId)) {
              dispatchUserCommand({ command: '智力', context })
              return true
            }
            return false
          }
        }
      ]
    }
  }
}

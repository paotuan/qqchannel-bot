module.exports = (apis) => {
  return {
    id: 'com.example.test',
    name: '测试插件',
    version: 1,
    customReply: [
      {
        id: 'test',
        name: '测试命令',
        description: '测试',
        command: '^test(?<content>.*)',
        trigger: 'regex',
        handler(env, matchGroup) {
          const card = apis.getCard(env)
          if (card) {
            const entry = card.getEntry('侦察')
            card.setEntry('侦察', entry.value + 10)
            return `你的技能：${entry.value}`
          } else {
            return '你没有人物卡'
          }
        }
      }
    ]
  }
}

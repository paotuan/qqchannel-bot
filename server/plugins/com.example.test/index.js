module.exports = (apis) => {
  return {
    // 插件 id，可以自己起，与文件夹名字保持一致即可
    id: 'com.example.test',
    // 插件名称，用于展示
    name: '测试插件',
    // 插件版本，自己控制即可
    version: 1,
    // 自定义回复
    customReply: [
      {
        // 自定义回复 id，可以自己起，在同一个插件内部唯一即可
        id: 'test',
        // 自定义回复命令名称，用于展示
        name: '测试命令',
        // 自定义回复命令描述，用于展示，可以在此处介绍用法
        description: '测试',
        // 自定义回复匹配规则，这个例子匹配所有 .testXXXX 格式的消息
        command: '^test(?<content>.*)',
        trigger: 'regex',
        // 自定义回复处理方法
        handler(env, matchGroup) {
          // 获取用户输入的内容，例如 .test XXXX 则提取出 XXXX
          const userInput = matchGroup.content.trim()
          // 判定规则：技能值+（2D6）+各种修正值
          // 1. 技能值
          let skillValue = Number(userInput)
          if (isNaN(skillValue)) {
            // 技能值不是数字，那么可能是人物卡的中的技能名，尝试获取
            const cardEntry = apis.getCard(env)?.getEntry(userInput)
            if (cardEntry) {
              skillValue = cardEntry.value
            } else {
              // 也没有人物卡，返回错误
              return '请输入技能值或关联人物卡'
            }
          }
          // 2. roll 2d6
          const r2d6 = apis.roll('2d6')
          const successLevel = r2d6.total === 2 ? '大失败' : r2d6.total === 12 ? '暴击' : ''
          // 3. 修正值
          // 假设技能值大于 50 修正 +2 否则 -2
          const modifiedExpression = skillValue > 50 ? '+2' : '-2'
          const modifiedValue = Number(modifiedExpression)
          // 4. 拼装结果并返回
          const finalValue = skillValue + r2d6.total + modifiedValue // 最终结果
          return `${env.nick} 🎲 ${userInput} ${skillValue}+2d6${modifiedExpression}: ${r2d6.rolls} = ${finalValue} ${successLevel}`
        }
      }
    ]
  }
}

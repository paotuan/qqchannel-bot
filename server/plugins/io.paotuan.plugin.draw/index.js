/* eslint-env node */
module.exports = (context) => {
  const { convertOtherFormatFiles } = require('./convert')
  const { loadDecks, reloadAllDecks, reloadDeck, drawDeck, drawRandomDeck } = require('./deck')
  const { roll, render } = context
  // 1. 从其他格式转换
  convertOtherFormatFiles()
  // 2. 构建牌堆到内存中
  loadDecks(roll)
  // 抽取方法
  const deckProxy = (prop) => {
    let putBack = true // 默认抽取放回
    let name = prop.trim()
    if (name.startsWith('!') || name.startsWith('！')) {
      putBack = false
      name = name.slice(1).trim()
    }
    return drawDeck(name, putBack)
  }
  // 解析指令
  const parse = (content) => {
    let deckName = ''
    let hidden = false
    let isReset = false
    content = content.trim()
    if (content.startsWith('h')) {
      hidden = true
      content = content.slice(1).trim()
    }
    if (content.startsWith('reset')) {
      isReset = true
      content = content.slice(5).trim()
    }
    deckName = content
    return { deckName, hidden, isReset }
  }

  return {
    id: 'io.paotuan.plugin.draw',
    name: '牌堆',
    version: 1,
    customReply: [
      {
        id: 'draw',
        name: '牌堆抽取',
        description: '/draw 牌堆名 - 抽取牌堆，省略牌堆名则进行随机选取\n/drawh - 暗抽\n/draw !牌堆名 - 不放回抽取\n/draw reset 牌堆名 - 重置牌堆，省略牌堆名则重置全部',
        command: '^\\s*draw(?<content>.*)',
        trigger: 'regex',
        handler(env, matchGroup) {
          const { deckName, hidden, isReset } = parse(matchGroup.content)
          const formatArgs = { ...env, 牌堆名: deckName }
          // reset
          if (isReset) {
            if (deckName) {
              reloadDeck(deckName, roll)
            } else {
              reloadAllDecks(roll)
            }
            return render('重置牌堆成功', formatArgs)
          }
          // draw
          try {
            let template
            if (deckName === '!' || deckName === '！') {
              template = drawRandomDeck(false)
            } else {
              template = deckName ? deckProxy(deckName) : drawRandomDeck(true)
            }
            return render(template, formatArgs, deckProxy)
            // todo hidden
          } catch (e) {
            // todo format err msg
            return e.message
          }
        }
      }
    ]
  }
}

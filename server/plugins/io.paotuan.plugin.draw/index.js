/* eslint-env node */
module.exports = (context) => {
  const { convertOtherFormatFiles } = require('./convert')
  const { loadDecks, reloadAllDecks, reloadDeck, drawDeck, drawRandomDeck, getAllDeckNames } = require('./deck')
  const { roll, render, sendMessageToUser } = context
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
    let isList = false
    content = content.trim()
    if (content.startsWith('h')) {
      hidden = true
      content = content.slice(1).trim()
    }
    if (content.startsWith('reset')) {
      isReset = true
      content = content.slice(5).trim()
    }
    if (content.startsWith('list')) {
      isList = true
      content = content.slice(4).trim()
    }
    deckName = content
    return { deckName, hidden, isReset, isList }
  }

  return {
    id: 'io.paotuan.plugin.draw',
    name: '牌堆',
    description: '牌堆插件。使用方法详见 paotuan.io/plugin/draw.html',
    version: 2,
    preference: [
      {
        key: 'hidden',
        label: '牌堆-暗抽',
        defaultValue: '{{at用户}}偷偷抽取了牌堆！'
      },
      {
        key: 'resetSuccess',
        label: '牌堆-重置',
        defaultValue: '{{at用户}}重置牌堆{{牌堆名}}成功'
      },
      {
        key: 'deckList',
        label: '牌堆-列出',
        defaultValue: '可用牌堆列表：'
      },
      {
        key: 'error.notFound',
        label: '牌堆-找不到牌堆',
        defaultValue: '找不到牌堆：{{牌堆名}}'
      },
      {
        key: 'error.initializeFailed',
        label: '牌堆-加载失败',
        defaultValue: '牌堆未初始化或初始化失败'
      },
      {
        key: 'error.empty',
        label: '牌堆-内容为空',
        defaultValue: '牌堆：{{牌堆名}} 为空'
      },
      {
        key: 'error.allEmpty',
        label: '牌堆-牌堆列表为空',
        defaultValue: '可用牌堆为空'
      }
    ],
    customReply: [
      {
        id: 'draw',
        name: '牌堆抽取',
        description: '/draw 牌堆名 - 抽取牌堆，省略牌堆名则进行随机选取\n/drawh - 暗抽\n/draw !牌堆名 - 不放回抽取\n/draw reset 牌堆名 - 重置牌堆，省略牌堆名则重置全部\n/draw list - 查看所有可供抽取的牌堆名',
        command: /^\s*draw(?<content>.*)/.source, // '^\\s*draw(?<content>.*)',
        trigger: 'regex',
        handler(env, matchGroup) {
          const pref = context.getPreference(env)
          const { deckName, hidden, isReset, isList } = parse(matchGroup.content)
          const formatArgs = { ...env, 牌堆名: deckName }
          // reset
          if (isReset) {
            if (deckName) {
              reloadDeck(deckName, roll)
            } else {
              reloadAllDecks(roll)
            }
            return render(pref['resetSuccess'], formatArgs)
          }
          // list
          if (isList) {
            const listNames = getAllDeckNames()
            return render(pref['deckList'], formatArgs) + '\n' + listNames.join('\n')
          }
          // draw
          try {
            let template
            if (deckName === '!' || deckName === '！') {
              template = drawRandomDeck(false)
            } else {
              template = deckName ? deckProxy(deckName) : drawRandomDeck(true)
            }
            const result = render(template, formatArgs, deckProxy)
            if (hidden) {
              sendMessageToUser(env, result)
              return render(pref['hidden'], formatArgs)
            } else {
              return result
            }
          } catch (e) {
            if (e instanceof Error) {
              return e.message
            } else {
              const message = pref[e.key]
              return render(message, { ...formatArgs, ...e.args })
            }
          }
        }
      }
    ]
  }
}

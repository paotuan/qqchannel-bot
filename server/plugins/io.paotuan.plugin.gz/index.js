/* eslint-env node */

// 人物卡字段名
const FIELD_GZ = 'gz'

// 是否展示当前故障值
function isCommandShow(command) {
  if (command === '' || command.startsWith('show')) {
    return { input: command.replace(/^show/, '').trim() }
  } else {
    return false
  }
}

// 是否清空故障值
function isCommandClear(command) {
  const prefix = /^(del|rm)/
  if (command.match(prefix)) {
    return { input: command.replace(prefix, '').trim() }
  } else {
    return false
  }
}

// 是否清空所有故障值
function isCommandClearAll(command) {
  return command.match(/^(0|clear|clr|x)$/)
}

// 解析通用场景
function parseCommon(command) {
  const match = command.match(/^(?<name>[a-zA-Z\p{Unified_Ideograph}]+)\s*(?<sign>[+\-=])?\s*(?<value>\d+)?$/u)
  if (!match) return false
  const sign = match.groups.sign
  return {
    input: match.groups.name,
    sign: sign === '+' || sign === '-' ? sign : '',
    value: match.groups.value
  }
}

// 记录故障值
function setGzValue(card, input, value) {
  if (!card.data.meta[FIELD_GZ]) {
    card.data.meta[FIELD_GZ] = {}
  }
  const map = card.data.meta[FIELD_GZ]
  // 考虑同义词
  let key = input
  const keys = card.getAliases(input)
  for (const _key of keys) {
    if (_key in map) {
      key = _key
      break
    }
  }
  // value 需要经过 clamp
  card.data.meta[FIELD_GZ][key] = value
}

// 清除故障值
function clearValue(card, input) {
  if (!card.data.meta[FIELD_GZ]) {
    return
  }
  const keys = card.getAliases(input)
  for (const key of keys) {
    delete card.data.meta[FIELD_GZ][key]
  }
}

// 清除所有故障值
function clearAll(card) {
  delete card.data.meta[FIELD_GZ]
}

// 获取故障值
function getGzValue(card, input) {
  if (!card.data.meta[FIELD_GZ]) {
    return undefined
  }
  const map = card.data.meta[FIELD_GZ]
  // 考虑同义词
  let key = input
  const keys = card.getAliases(input)
  for (const _key of keys) {
    if (_key in map) {
      key = _key
      break
    }
  }
  return map[key]
}

module.exports = (apis) => {
  return {
    id: 'io.paotuan.plugin.gz',
    name: '故障值',
    description: '记录枪械的故障值，并在检定时给予提示。\n.gz - 查看当前的故障值\n.gz手枪60 - 指定故障值。掷骰结果大于等于故障值，认为发生了故障\n.gz手枪-5 - 增减故障值\n.gz del 手枪 - 删除某项故障值\n.gz clear - 清除所有故障值记录',
    version: 1,
    preference: [
      {
        key: 'text.show',
        label: '展示当前的故障值',
        defaultValue: '{{人物卡名}} 当前的故障值:\n{{#条目列表}}{{技能名}}:{{故障值}} {{/条目列表}}{{^条目列表}}暂无{{/条目列表}}'
      },
      {
        key: 'text.clear',
        label: '清除故障值记录',
        defaultValue: '{{人物卡名}} 已清除{{#技能名}}{{技能名}}{{/技能名}}{{^技能名}}全部{{/技能名}}故障值记录'
      },
      {
        key: 'text.set',
        label: '设置故障值',
        defaultValue: '{{人物卡名}} 设置 {{技能名}} 的故障值为 {{#增减}}{{表达式}} = {{/增减}}{{故障值}}'
      },
      {
        key: 'text.trigger',
        label: '触发故障',
        defaultValue: '{{人物卡名}} 的 {{技能名}} 出现了故障！'
      }
    ],
    customReply: [
      {
        id: 'gz',
        name: '故障值',
        description: '.gz - 查看当前的故障值\n.gz手枪60 - 指定故障值。掷骰结果大于等于故障值，认为发生了故障\n.gz手枪-5 - 增减故障值\n.gz del 手枪 - 删除某项故障值\n.gz clear - 清除所有故障值记录',
        command: /^\s*gz(?<content>.*)/.source,
        trigger: 'regex',
        handler(env, matchGroup) {
          const card = apis.getCard(env)
          const pref = apis.getPreference(env)
          // 无人物卡
          if (!card) {
            return '当前用户未关联人物卡'
          }
          const command = matchGroup.content.trim()
          // 是否是展示
          const parseShow = isCommandShow(command)
          if (parseShow) {
            return handleDisplay(apis, env, card, pref, parseShow.input)
          }
          // 是否是清除全部
          if (isCommandClearAll(command)) {
            return handleClearAll(apis, env, card, pref)
          }
          // todo 目前均不支持同时设置多个
          // 是否是清除单个
          const parseDel = isCommandClear(command)
          if (parseDel) {
            return handleDel(apis, env, card, pref, parseDel.input)
          }
          // 解析单个设置
          try {
            const parsed = parseCommon(command)
            if (!parsed) return ''
            // 如果没有数值，认为是展示
            if (!parsed.value) {
              return handleDisplay(apis, env, card, pref, parsed.input)
            }
            // 拼接设置表达式
            const expression = (() => {
              if (parsed.sign) {
                const oldValue = getGzValue(card, parsed.input)
                const baseValue = typeof oldValue === 'number' ? oldValue : 100 // 如果原来没有值，就认为是 100（无故障）吧
                return `${baseValue}${parsed.sign}${parsed.value}`
              } else {
                return parsed.value
              }
            })()
            const newValue = apis.roll(expression).total
            const clampedValue = clamp(newValue, 0, 100) // 故障值限制在 0-100 之间
            // 设置之
            setGzValue(card, parsed.input, clampedValue)
            apis.saveCard(card)
            return apis.render(pref['text.set'], { ...env, 技能名: parsed.input, 增减: !!parsed.sign, 表达式: expression, 故障值: clampedValue })
          } catch (e) {
            // 格式不合法，无视之
            return ''
          }
        }
      }
    ],
    hook: {
      afterDiceRoll: [
        {
          id: 'trigger',
          name: '触发故障播报',
          handler: roll => {
            const card = roll.selfCard
            // 无人物卡，不处理
            if (!card) return
            // 对于每个检定，判断是否存在故障值
            const triggeredEntries = []
            roll.rolls.forEach(result => {
              const total = result.roll.total
              result.tests.forEach(test => {
                const skill = test.skill
                const gz = getGzValue(card, skill)
                if (typeof gz === 'number' && total >= gz) {
                  triggeredEntries.push({ 技能名: skill, 掷骰结果: total, 故障值: gz })
                }
              })
            })
            if (triggeredEntries.length === 0) return
            // 拼装结果并发消息
            const pref = apis.getPreference({ channelId: roll.context.channelId })
            const output = triggeredEntries.map(entry => apis.render(pref['text.trigger'], { ...roll._commonTArgs, ...entry })).join('\n')
            setTimeout(() => {
              apis.sendMessageToChannel(roll.context, output, { skipParse: true })
            }, 200)
          }
        }
      ]
    }
  }
}

function handleDisplay({ render }, env, card, pref, input = '') {
  if (!input) {
    // 展示全部
    const map = card.data.meta[FIELD_GZ] || {}
    const list = Object.keys(map).map(key => ({ 技能名: key, 故障值: map[key] }))
    return render(pref['text.show'], { ...env, 条目列表: list })
  } else {
    // 展示单个
    let value = getGzValue(card, input)
    if (typeof value !== 'number') {
      value = '-' // 用于展示
    }
    return render(pref['text.show'], { ...env, 条目列表: [{ 技能名: input, 故障值: value }] })
  }
}

function handleClearAll({ render, saveCard }, env, card, pref) {
  clearAll(card)
  saveCard(card)
  return render(pref['text.clear'], env)
}

function handleDel({ render, saveCard }, env, card, pref, input) {
  clearValue(card, input)
  saveCard(card)
  return render(pref['text.clear'], { ...env, 技能名: input })
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max)
}

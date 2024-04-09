/* eslint-env node */

// match 独立出现的疑似人物卡引用（前后不为数字或 $，前向匹配简化了）
const MAYBE_ENTRY_REGEX = /(?<=[+\-*/(])([a-zA-Z\p{Unified_Ideograph}]+)(?![\d$])/gu
const MAYBE_ENTRY_REGEX_AT_START = /^([a-zA-Z\p{Unified_Ideograph}]+)(?=[+\-*/])/gu

// match 疑似默认骰
const DEFAULT_ROLL_REGEX = /^(r|d|rd)$/
const MAYBE_INCLUDE_DEFAULT_ROLL_REGEX = /(?<=^|[+\-*/(])(r|d|rd)(?=$|[+\-*/)}])/g

module.exports = ({ getCard, getConfig }) => {
  return {
    id: 'io.paotuan.plugin.compatible',
    name: '实验性指令设置',
    description: '以下设置并非绝对严谨，可能会与现有的指令体系产生冲突。但在大部分场景下，这些设置可以一定程度方便用户的操作。包含：\n- 指令对大小写不敏感\n- 智能探测指令中引用的人物卡条目\n- 默认骰支持加减值',
    version: 1,
    hook: {
      onReceiveCommand: [
        // 处理指令前缀的大小写
        {
          id: 'convertCase-Prefix',
          name: '指令对大小写不敏感（处理指令前缀）',
          description: '支持大写的指令前缀',
          defaultEnabled: false,
          handler: (diceCommand) => convertCase(diceCommand)
        }
      ],
      beforeParseDiceRoll: [
        {
          id: 'convertCase',
          name: '指令对大小写不敏感',
          description: '能够识别【1D100】之类的大写表达式，并转换成小写进行解析',
          defaultEnabled: false,
          handler: (diceCommand) => convertCase(diceCommand)
        },
        {
          id: 'detectCardEntry',
          name: '探测指令中引用的人物卡条目',
          description: '指令引用人物卡条目时，可不加【$】前缀，如【1d3+db】。系统会自动探测指令中包含的人物卡条目，并替换为对应的值',
          defaultEnabled: false,
          handler: (diceCommand) => {
            // 特殊：【.st力量+1】 st 指令需要排除 // 【.en+侦察】en 也排除 // 目前应该不需要了
            const card = getCard(diceCommand.context)
            if (!card) {
              return false
            }
            const expression = diceCommand.command
            const parsed = (() => {
              const replacer = (key) => {
                if (card.getEntry(key) || card.getAbility(key)) {
                  return '$' + key
                } else {
                  return key
                }
              }
              return expression.replace(MAYBE_ENTRY_REGEX, replacer).replace(MAYBE_ENTRY_REGEX_AT_START, replacer)
            })()
            if (parsed === expression) {
              return false
            } else {
              console.log('智能探测', expression, '->', parsed)
              diceCommand.command = parsed
              return true
            }
          }
        },
        {
          id: 'detectDefaultRoll',
          name: '默认骰支持加减值',
          description: '使用【r/d/rd】掷默认骰时，支持参与进一步运算，例如【r+1】',
          defaultEnabled: false,
          handler: (diceCommand) => {
            const expression = diceCommand.command
            // 纯默认骰不处理，交给原来的逻辑处理
            if (expression.match(DEFAULT_ROLL_REGEX)) {
              return false
            }
            const config = getConfig(diceCommand.context)
            const card = getCard(diceCommand.context)
            const defaultRoll = getDefaultRoll(config, card)
            const parsed = expression.replace(MAYBE_INCLUDE_DEFAULT_ROLL_REGEX, () => defaultRoll)
            if (parsed === expression) {
              return false
            } else {
              console.log('默认骰替换', expression, '->', parsed)
              diceCommand.command = parsed
              return true
            }
          }
        }
      ]
    }
  }
}

/**
 * 指令兼容大小写
 * 目前的实现是简单粗暴转全小写（引用人物卡的部分本来就不区分大小写，因此只用考虑骰子指令和描述部分）
 * 针对 dF 特殊处理
 */
function convertCase(obj) {
  const expression = obj.command
  const parsed = (() => {
    const dFIndexes = Array.from(expression.matchAll(/dF/g)).map(result => result.index)
    const result = expression.toLowerCase()
    if (dFIndexes.length === 0) return result
    const arr = result.split('')
    dFIndexes.forEach(index => {
      if (typeof index === 'number') {
        arr[index + 1] = 'F'
      }
    })
    return arr.join('')
  })()
  if (parsed === expression) {
    return false
  } else {
    console.log('指令兼容大小写', expression, '->', parsed)
    obj.command = parsed
    return true
  }
}

function getDefaultRoll(config, card) {
  if (config.defaultRoll.preferCard && card) {
    return card.defaultRoll || 'd%'
  }
  return config.defaultRoll.expression || 'd%'
}

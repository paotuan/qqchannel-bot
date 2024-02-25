/* eslint-env node */

// match inline roll 和 attribute
const ENTRY_REGEX = /\$\{(.*?)\}|\$([a-zA-Z\p{Unified_Ideograph}]+)/gu // match ${ any content } or $AnyContent
const INLINE_ROLL_REGEX = /\[\[([^[\]]+)]]/ // match [[ any content ]]

module.exports = ({ getCard }) => {
  return {
    id: 'com.yq.inlineparsestrategy',
    name: '修改骰子指令解析策略',
    description: '使用循环而非递归进行解析，作用是一次性把表达式打平，在掷骰输出时更为简洁明了，缺点是会丧失一些功能',
    version: 1,
    hook: {
      beforeParseDiceRoll: [
        {
          id: 'x',
          name: '修改骰子指令解析策略',
          /**
           * 使用 naive 的循环策略解析 inline 和 expression 引用
           * e.g. [[1d3+1]] => 1d3+1; $db => 1d3
           * 作用是一次性把表达式打平，在掷骰输出时更为简洁明了
           * 缺点是丧失了递归回溯（$1, $2）和 [[1d10]]d10 的拼接能力，以及可能造成优先级的破坏
           */
          handler: (diceCommand) => {
            const old = diceCommand.command
            let expression = old
            // 替换 entry
            const card = getCard(diceCommand.context)
            let depth = 0
            while (ENTRY_REGEX.test(expression)) {
              expression = expression.replace(ENTRY_REGEX, (_, key1, key2) => {
                const key = key1 || key2 || ''
                const abilityExpression = getAbility(card, key)
                if (typeof abilityExpression !== 'undefined') {
                  return abilityExpression
                }
                const skillValue = getEntry(card, key)
                if (typeof skillValue !== 'undefined') {
                  return skillValue
                }
                return ''
              })

              if (++depth > 99) {
                console.error('stackoverflow in inlineParseStrategy')
                break
              }
            }
            // 替换 inline roll
            while (INLINE_ROLL_REGEX.test(expression)) {
              expression = expression.replace(INLINE_ROLL_REGEX, (_, notation) => notation)
            }
            // finish
            if (expression === old) {
              return false
            } else {
              console.log('修改骰子指令解析策略', old, '->', expression)
              diceCommand.command = expression
              return true
            }
          }
        }
      ]
    }
  }
}

function getEntry(card, key) {
  if (!card) return undefined
  const entry = card.getEntry(key)
  if (!entry) return undefined
  return String(entry.value)
}

function getAbility(card, key) {
  if (!card) return undefined
  const ability = card.getAbility(key)
  if (!ability) return undefined
  return ability.value
}

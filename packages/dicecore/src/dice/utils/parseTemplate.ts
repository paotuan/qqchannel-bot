import type { CommandSource, DiceCommand, UserRole } from '@paotuan/config'
import { CardProvider } from '../../card/card-provider'
import { ConfigProvider } from '../../config/config-provider'
import { StandardDiceRoll } from '../standard'
import { InlineDiceRoll } from '../standard/inline'

export interface IDiceRollContext {
  userId: string
  username: string
  userRole: UserRole
  channelUnionId: string // 一个 channel 的唯一标识
  opposedRoll?: StandardDiceRoll
}

const ENTRY_REGEX = /\$\{(.*?)\}|\$([a-zA-Z\p{Unified_Ideograph}]+)/gu // match ${ any content } or $AnyContent
const INLINE_ROLL_REGEX = /\[\[([^[\]]+)]]/ // match [[ any content ]]
const HISTORY_ROLL_REGEX = /\$(\d+)/g // match $1 $2...

/**
 * 解析原始表达式模板，替换 ability, attribute and inline rolls
 */
export function parseTemplate(expression: string, context: IDiceRollContext, history: InlineDiceRoll[], source?: CommandSource, depth = 0): string {
  debug(depth, '解析原始表达式:', expression)
  if (depth > 99) throw new Error('stackoverflow in parseTemplate!!')

  const config = ConfigProvider.INSTANCE.getConfig(context.channelUnionId)
  // region hook 处理
  // 如果是自定义回复直接触发的，或通过插件 sendMessage* 接口发送的消息，则不触发此 hook
  // 因为这些情况下发送的其实是文字而不是掷骰指令，可能造成插件错误处理这些情况
  if (source !== 'message_template') {
    const diceCommand: DiceCommand = {
      command: expression,
      context: {
        channelUnionId: context.channelUnionId,
        userId: context.userId,
        username: context.username,
        userRole: context.userRole
      },
      source
    }
    config.hook_beforeParseDiceRoll(diceCommand)
    expression = diceCommand.command
  }
  // endregion

  const selfCard = CardProvider.INSTANCE.getCard(context.channelUnionId, context.userId)
  const getEntry = (key: string) => selfCard?.getEntry(key)?.value ?? ''
  const getAbility = (key: string) => selfCard?.getAbility(key)?.value ?? ''
  // 1. 如检测到 ability or attribute，则求值并替换
  expression = expression.replace(ENTRY_REGEX, (_, key1?: string, key2?: string) => {
    const key = key1 ?? key2 ?? ''
    // 1.1 是否是 ability？ability 替换为的表达式可能也含有其他的 ability、attribute or inline dice，因此需递归地求值
    const abilityExpression = getAbility(key)
    if (abilityExpression) {
      debug(depth, '递归解析 ability:', key, '=', abilityExpression)
      const parsedAbility = parseTemplate(abilityExpression, context, history, undefined, depth + 1)
      // 将 key 拼接到表达式后面，这样 key 就会自然地被解析为 description 输出，优化 output 展示
      const dice = new InlineDiceRoll(`${parsedAbility.trim()} ${key}`, context).roll()
      debug(depth, '求值 ability:', dice.total)
      history.push(dice) // 计入 history
      return dice.hidden ? '' : String(dice.total)
    }
    // 1.2 是否是 attribute，如是，则替换为值
    const skillValue = getEntry(key)
    debug(depth, '解析 attribute:', key, '=', skillValue)
    return String(skillValue ?? '')
  })
  // 2. 如检测到 inline dice，则求值并记录结果
  const thisLevelInlineRolls: InlineDiceRoll[] = [] // 只保存本层的 inline roll 结果，避免 $1 引用到其他层的结果
  //    考虑到 inline dice 嵌套的场景，无限循环来为所有 inline dice 求值
  while (INLINE_ROLL_REGEX.test(expression)) {
    expression = expression.replace(INLINE_ROLL_REGEX, (_, notation: string) => {
      debug(depth, '循环解析 inline:', notation)
      // 注意 inline dice 的 notation 中可能含有 $1，此时需要引用到 thisLevelInlineRolls 的结果
      notation = notation.replace(HISTORY_ROLL_REGEX, (_, index: string) => {
        const historyRoll = thisLevelInlineRolls[Number(index) - 1]
        const result = historyRoll ? String(historyRoll.total) : ''
        debug(depth, `替换 $${index} =`, result)
        return result
      })
      // 理论上 ability 和 attribute 都被替换完了，这里无需再递归解析，可以直接 roll
      const dice = new InlineDiceRoll(notation.trim(), context).roll()
      debug(depth, '求值 inline:', dice.total)
      history.push(dice)
      thisLevelInlineRolls.push(dice) // inline roll 存起来
      // 如果是暗骰则不显示，否则返回值
      return dice.hidden ? '' : String(dice.total)
    })
  }
  // 3. 替换 $1 $2
  expression = expression.replace(HISTORY_ROLL_REGEX, (_, index: string) => {
    const historyRoll = thisLevelInlineRolls[Number(index) - 1]
    const result = historyRoll ? String(historyRoll.total) : ''
    debug(depth, `替换 $${index} =`, result)
    return result
  })
  // 4. finish
  debug(depth, '解析结果:', expression)
  return expression
}

function debug(depth: number, tag: any, ...args: any[]) {
  const indent = new Array(depth).fill('__').join('')
  console.log(indent + tag, ...args)
}

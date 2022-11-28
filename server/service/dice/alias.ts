import { IDiceRollContext, parseTemplate } from './utils'
import { InlineDiceRoll } from './standard/inline'

// 别名指令
interface IAliasExpressionConfig {
  alias: string
  regexCache: RegExp | null
  replacer: (result: RegExpMatchArray) => string
}

export const AliasExpressions: IAliasExpressionConfig[] = [
  {
    alias: 'r([bp])(\\d*)',
    regexCache: null,
    replacer: (result) => {
      const type = result[1] === 'b' ? 'l' : 'h'
      const count = parseInt(result[2] || '1', 10) // 默认一个奖励/惩罚骰
      return `${count + 1}d%k${type}1`
    }
  },
  {
    alias: 'ra',
    regexCache: null,
    replacer: () => 'd%'
  },
  {
    alias: 'rc',
    regexCache: null,
    replacer: () => 'ra'
  },
  {
    alias: 'w{1,2}(\\d+)a?(\\d+)*',
    regexCache: null,
    replacer: (result) => {
      const diceCount = parseInt(result[1], 10)
      const explodeCount = parseInt(result[2] || '10', 10) // 默认达到 10 重投
      return `${diceCount}d10!>=${explodeCount}>=8`
    }
  }
]

type ParseAliasResult = { expression: string, rest: string }

export function parseAlias(expression: string, context: IDiceRollContext, inlineRolls: InlineDiceRoll[], depth = 0): ParseAliasResult {
  if (depth > 99) throw new Error('stackoverflow!!')
  for (const config of AliasExpressions) {
    config.regexCache ??= new RegExp(`^${config.alias}`)
    const match = expression.match(config.regexCache)
    if (match) {
      const replacement = config.replacer(match)
      console.log('[Dice] 解析别名:', match[0], '=', replacement)
      const parsed = parseTemplate(replacement, context, inlineRolls)
      return {
        expression: parseAlias(parsed, context, inlineRolls, depth + 1).expression,
        rest: expression.slice(match[0].length)
      }
    }
  }
  return { expression, rest: '' }
}

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
    alias: 'r[ac]',
    regexCache: null,
    replacer: () => 'd%'
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

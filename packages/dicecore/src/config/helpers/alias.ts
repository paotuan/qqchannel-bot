import { IDiceRollContext, parseTemplate } from '../../dice/utils/parseTemplate'
import type { InlineDiceRoll } from '../../dice/standard/inline'
import type { IAliasRollConfig } from '@paotuan/config'
import { SyncLruCache } from '../../utils/sync-lru-cache'

// alias 的 command 解析为正则表达式和默认值
interface INaiveCommandParsed {
  regex: RegExp
  defaultValues: { [key: string]: number }
}

const NaiveCommandCache = new SyncLruCache<string, INaiveCommandParsed>({
  max: 50,
  fetchMethod: expression => { // rb{{X=1}} => rb(?<X>\d*)
    // console.log('[Config.Alias] 缓存预热中。如果长期运行后仍然频繁出现此提示，可以考虑增加缓存容量')
    const defaultValues: { [key: string]: number } = {}
    const parsed = expression.replace(/\{\{\s*([^{}]*)\s*\}\}/g, (_, key) => {
      const [_name, _defaultValue = ''] = key.split('=')
      const name = _name.trim()
      defaultValues[name] = parseInt(_defaultValue.trim(), 10) || 1
      return `(?<${name}>\\d*)`
    })
    return { regex: new RegExp(`^${parsed}`), defaultValues }
  }
})

type StringReplacerResolved = (c: { [key: string]: number }) => string
const StringReplacerCache = new SyncLruCache<string, StringReplacerResolved>({
  max: 50,
  fetchMethod: expression => {
    // console.log('[Config.Alias] 缓存预热中。如果长期运行后仍然频繁出现此提示，可以考虑增加缓存容量')
    const [paramsList, funcBody] = expression.split('|')
    // {{X+1}}d%kl1 => ${X+1}d%kl1
    const templateString = funcBody.replace(/\{\{\s*([^{}]*)\s*\}\}/g, '${$1}')
    return new Function('context', `"use strict"; const {${paramsList}} = context; return \`${templateString}\``) as StringReplacerResolved
  }
})

// 原生 regex 缓存
const RegexCommandCache = new SyncLruCache<string, RegExp>({
  max: 50,
  fetchMethod: expression => new RegExp(`^${expression}`)
})

type ParseAliasResult = { expression: string, rest: string }

export function parseAliasForExpression(processors: IAliasRollConfig[], expression: string, context: IDiceRollContext, inlineRolls: InlineDiceRoll[], depth = 0): ParseAliasResult {
  if (depth > 99) throw new Error('别名指令嵌套过深，可能触发死循环，请检查你的别名指令配置！')
  for (const config of processors) {
    if (!config.command) continue // 避免 command 啥都没填的情况，匹配任意值，变成死循环
    if (config.scope !== 'expression') continue // scope 必须为 'expression'
    let match: RegExpMatchArray | null = null // 正则表达式匹配结果
    let replacement: string | undefined = undefined // 别名指令替换后的结果
    if (config.trigger === 'naive') {
      const naiveParsedCommand = NaiveCommandCache.get(config.command)
      if (!naiveParsedCommand) continue // 理论不会，除非出错的情况
      const regex = naiveParsedCommand.regex
      // 是否匹配到这条 alias
      match = expression.match(regex)
      if (!match) continue
      // get replacer
      const paramsList = Object.keys(naiveParsedCommand.defaultValues).join(',')
      const userParams = combineReplaceParams(match.groups, naiveParsedCommand.defaultValues)
      const replacer = StringReplacerCache.get(`${paramsList}|${config.replacer}`)
      try {
        replacement = replacer?.(userParams)
      } catch (e: any) {
        console.error('[Config] 解析别名指令失败', e?.message, 'command=', config.command)
      }
    } else {
      const regex = RegexCommandCache.get(config.command)
      if (!regex) continue
      // 是否匹配到这条 alias
      match = expression.match(regex)
      if (!match) continue
      // get replacer
      try {
        replacement = config.replacer(match)
      } catch (e: any) {
        console.error('[Config] 解析别名指令失败', e?.message, 'command=', config.command)
      }
    }
    if (!replacement) break // 匹配到了，但是因为替换方法有误导致无法进行，就直接 break 吧
    console.log('[Dice] 解析别名:', match[0], '=', replacement)
    const parsed = parseTemplate(replacement, context, inlineRolls)
    return {
      expression: parseAliasForExpression(processors, parsed, context, inlineRolls, depth + 1).expression,
      rest: expression.slice(match[0].length)
    }
  }
  return { expression, rest: '' }
}

// 根据匹配到的用户参数和模板的默认参数，得出用于 replace 表达式的参数列表
function combineReplaceParams(matchGroup: {[p: string]: string} | undefined, defaultValues: { [key: string]: number } = {}) {
  if (!matchGroup) return defaultValues
  const userParams = Object.keys(matchGroup).reduce((obj, varname) => {
    const value = parseInt(matchGroup[varname], 10)
    return isNaN(value) ? obj : Object.assign(obj, { [varname]: value })
  }, {})
  return { ...defaultValues, ...userParams }
}

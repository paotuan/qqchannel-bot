import { SyncLruCache } from '../sync-lru-cache'
import { IAliasRollConfig } from '@paotuan/types'
import Mustache from 'mustache'

// 原生 regex 缓存
const RegexCommandCache = new SyncLruCache<string, RegExp>({
  max: 50,
  fetchMethod: expression => new RegExp(expression)
})

export function parseAliasForCommand(processors: IAliasRollConfig[], command: string) {
  let depth = 0
  let result = command
  // 无限循环解析。如果有多个规则，可以让这些规则之间的顺序无关
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 死循环检测
    if (depth > 99) throw new Error('别名指令嵌套过深，可能触发死循环，请检查你的别名指令配置！')
    depth++
    // 本次是否处理过
    let matchedAlias = false
    // 从上到下处理
    for (const config of processors) {
      if (!config.command) continue // 避免 command 啥都没填的情况，匹配任意值，变成死循环
      if (config.scope !== 'command') continue // scope 必须为 'command'
      if (config.trigger === 'startWith') {
        if (result.startsWith(config.command)) {
          matchedAlias = true
          if (typeof config.replacer === 'string') {
            result = result.replace(config.command, config.replacer)
          } else {
            // 理论上使用 startWith 匹配时，不应该使用 function 的 replacer
            console.warn('[Alias] unsupported trigger = startWith & replacer = function')
          }
        }
      } else {
        const regex = RegexCommandCache.get(config.command)
        if (!regex) continue
        // 是否匹配到这条 alias
        const match = result.match(regex)
        if (!match) continue
        matchedAlias = true
        if (typeof config.replacer === 'string') {
          // result = result.replace(regex, config.replacer) // 这里不直接 replace 了，而是用 matchGroup 替换，这样和自定义回复保持一致
          const matchGroups = match.groups || {}
          result = Mustache.render(config.replacer, matchGroups, undefined, { escape: value => value })
        } else {
          result = config.replacer(match)
        }
      }
    }
    // 判断是否处理完了
    if (!matchedAlias) {
      break
    }
  }
  return result
}

import { SuccessLevel } from '../../dice/utils'
import { SyncLruCache } from '../sync-lru-cache'
import type { IRollDeciderConfig } from '../../../../interface/config'
import { render } from 'mustache'

export interface IRollDecideContext {
  baseValue: number
  targetValue: number
  roll: number
}

export interface IRollDecideResult {
  success: boolean
  level: SuccessLevel
  desc: string
}

// 全局模板和 function 缓存配置
// config 嵌套比较复杂，与其小心翼翼地维护每一级的对象结构，不如简单粗暴地用一个缓存，反正它们都是纯的
type RollDeciderExpressionResolved = (c: IRollDecideContext) => boolean
const RollDeciderExpressionCache = new SyncLruCache<string, RollDeciderExpressionResolved>({
  max: 50,
  fetchMethod: expression => {
    // console.log('[Config.Decider] 缓存预热中。如果长期运行后仍然频繁出现此提示，可以考虑增加缓存容量')
    const normalized = expression.trim() || false // expression 不填默认认为是 false
    return new Function('context', `"use strict"; const { baseValue, targetValue, roll } = context; return !!(${normalized})`) as RollDeciderExpressionResolved
  }
})

// 根据当前的规则计算是否成功
export function decideRoll(decider: IRollDeciderConfig | undefined, context: IRollDecideContext): IRollDecideResult | undefined {
  if (!decider) {
    return undefined // 不要规则
  }
  // 根据顺序判断命中了哪个成功等级
  const resultLevel = rollDeciderHit(decider, context)
  if (!resultLevel) {
    return undefined // 规则出错或匹配不上任何一条成功等级
  }
  // 根据命中等级解析描述字符串
  const rule = decider.rules[resultLevel]
  return {
    success: ['best', 'success'].includes(resultLevel),
    level: transformSuccessLevel(resultLevel),
    desc: render(rule.reply, context) // mustache 内部有缓存
  }
}

// 判断投骰结果命中了哪个等级
function rollDeciderHit(decider: IRollDeciderConfig, context: IRollDecideContext) {
  try {
    const resultLevels = ['worst', 'best', 'fail', 'success'] as const
    for (const resultLevel of resultLevels) {
      const rule = decider.rules[resultLevel]
      const func = RollDeciderExpressionCache.get(rule.expression)
      if (func?.(context)) {
        return resultLevel
      }
    }
    return undefined
  } catch (e: any) {
    console.error('[Config] 判断成功等级出错', e?.message, 'context=', JSON.stringify(context))
    return undefined
  }
}

function transformSuccessLevel(level: string): SuccessLevel {
  switch (level) {
  case 'worst':
    return SuccessLevel.WORST
  case 'best':
    return SuccessLevel.BEST
  case 'success':
    return SuccessLevel.REGULAR_SUCCESS
  case 'fail':
  default:
    return SuccessLevel.FAIL
  }
}

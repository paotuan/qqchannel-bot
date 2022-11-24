import type { IChannelConfig, ICustomReplyConfig, IRollDeciderConfig } from '../../../interface/config'
import { makeAutoObservable } from 'mobx'
import type { PluginManager } from './plugin'
import { SuccessLevel } from '../dice/utils'
import { SyncLruCache } from './sync-lru-cache'
import { render } from 'mustache'

interface IRollDecideContext {
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
    // console.log('[Config] 缓存预热中。如果长期运行后仍然频繁出现此提示，可以考虑增加缓存容量')
    return new Function('context', `"use strict"; const { baseValue, targetValue, roll } = context; return !!(${expression})`) as RollDeciderExpressionResolved
  }
})

// 频道配置文件封装
// !只读 config，不要写 config
export class ChannelConfig {
  config: IChannelConfig
  private readonly plugin: PluginManager // todo plugin 后续和 wss 解耦？

  constructor(config: IChannelConfig, plugins: PluginManager) {
    makeAutoObservable<this, 'plugin'>(this, { plugin: false })
    this.config = config
    this.plugin = plugins
  }

  /**
   * 默认骰配置
   */
  get defaultRoll() {
    return this.config.defaultRoll
  }

  // 子频道 embed 自定义回复配置索引
  private get embedCustomReplyMap(): Record<string, ICustomReplyConfig> {
    const items = this.config.embedPlugin.customReply
    if (!items) return {}
    const embedPluginId = this.config.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  }

  /**
   * 子频道自定义回复处理器列表
   */
  get customReplyProcessors() {
    const ret = this.config.customReplyIds
      .filter(item => item.enabled)
      .map(item => this.embedCustomReplyMap[item.id]/* || this.plugin.pluginCustomReplyMap[item.id]*/)
      .filter(conf => !!conf)
    // todo 目前全部启用插件
    ret.push(...Object.values(this.plugin.pluginCustomReplyMap))
    return ret
  }

  // embed 规则配置索引
  private get embedRollDeciderMap(): Record<string, IRollDeciderConfig> {
    const items = this.config.embedPlugin.rollDecider
    if (!items) return {}
    const embedPluginId = this.config.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  }

  // 当前正在使用的规则配置
  private get rollDecider() {
    const currentId = this.config.rollDeciderId
    if (!currentId) return undefined // 不要规则的情况
    return this.embedRollDeciderMap[currentId] || this.plugin.pluginRollDeciderMap[currentId]
  }

  // 根据当前的规则计算是否成功
  decideRoll(context: IRollDecideContext): IRollDecideResult | undefined {
    const decider = this.rollDecider
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
    // const template = RollDeciderReplyTemplateCache.get(rule.reply)
    return {
      success: ['best', 'success'].includes(resultLevel),
      level: transformSuccessLevel(resultLevel),
      desc: render(rule.reply, context) // mustache 内部有缓存
    }
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

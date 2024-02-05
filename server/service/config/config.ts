import type {
  IAliasRollConfig,
  IChannelConfig,
  ICustomReplyConfig,
  ICustomTextConfig,
  IRollDeciderConfig,
  CustomTextKeys
} from '../../../interface/config'
import { makeAutoObservable } from 'mobx'
import type { PluginManager } from './plugin'
import { decideRoll, IRollDecideContext } from './helpers/decider'
import type { IDiceRollContext } from '../dice/utils'
import type { InlineDiceRoll } from '../dice/standard/inline'
import { parseAliasForExpression } from './helpers/alias'
import { getEmbedCustomText } from './default'
import { renderCustomText } from './helpers/customText'
import type { ICard } from '../../../interface/card/types'
import { parseAliasForCommand } from './helpers/aliasCommand'

// 频道配置文件封装
export class ChannelConfig {
  config: IChannelConfig
  private readonly plugin?: PluginManager // todo plugin 后续和 wss 解耦？

  // plugin 可选 for mock test 的情况，正常运行中不会为空
  constructor(config: IChannelConfig, plugins?: PluginManager) {
    makeAutoObservable<this, 'plugin'>(this, { plugin: false })
    this.config = config
    this.plugin = plugins
    this.updateConfigByPluginManifest()
  }

  // 确保某个 plugin 在配置中存在
  private _ensurePluginConfig(pluginId: string) {
    const pluginConfig = this.config.plugins.find(_plugin => _plugin.id === pluginId)
    if (pluginConfig) {
      return pluginConfig
    }
    // 新增的 plugins 默认启用
    const newPluginConfig = { id: pluginId, enabled: true, preference: {} }
    this.config.plugins.push(newPluginConfig)
    // 如果是新增的 plugin，不能直接返回 pluginConfig，应该是因为内部做了代理，要返回代理后的对象
    // 否则后面对 config 的修改会不生效
    return this.config.plugins.find(_plugin => _plugin.id === pluginId)!
  }

  // 把插件里的各个项目开启状态保存到 config 对象中
  updateConfigByPluginManifest() {
    if (!this.plugin) return
    const manifest = this.plugin.pluginListManifest
    // 记录一下当前每个功能的 id，用于第三部 purge
    const existIds = {
      customReplyIds: new Set<string>(),
      aliasRollIds: new Set<string>(),
      customTextIds: new Set<string>(),
      hookIds: {
        onReceiveCommand: new Set<string>()
      }
    }
    manifest.forEach(plugin => {
      // 0. 确保 plugin 在配置中存在
      const pluginConfig = this._ensurePluginConfig(plugin.id)
      // 1. 写入/更新 preference，确保 preference 的 key 在配置中存在，以便在前端双向绑定
      const preference: Record<string, string> = {}
      plugin.preference.forEach(pref => {
        preference[pref.key] = pluginConfig.preference[pref.key] ?? pref.defaultValue
      })
      pluginConfig.preference = preference
      // 2. 处理 plugin 内每个功能的开启状态
      // 如果是 disabled 状态的 plugin，不处理. disabled 状态的 plugin 下所有功能都应该不存在，不出现在 config 里
      if (!pluginConfig.enabled) return
      plugin.customReply.forEach(config => {
        const id = `${plugin.id}.${config.id}`
        existIds.customReplyIds.add(id)
        if (!this.config.customReplyIds.find(_config => _config.id === id)) {
          this.config.customReplyIds.push({ id, enabled: config.defaultEnabled })
        }
      })
      // rollDecider 先忽略
      plugin.aliasRoll.forEach(config => {
        const id = `${plugin.id}.${config.id}`
        existIds.aliasRollIds.add(id)
        if (!this.config.aliasRollIds.find(_config => _config.id === id)) {
          this.config.aliasRollIds.push({ id, enabled: config.defaultEnabled })
        }
      })
      plugin.customText.forEach(config => {
        const id = `${plugin.id}.${config.id}`
        existIds.customTextIds.add(id)
        if (!this.config.customTextIds.find(_config => _config.id === id)) {
          this.config.customTextIds.push({ id, enabled: config.defaultEnabled })
        }
      })
      plugin.hook.onReceiveCommand.forEach(config =>{
        const id = `${plugin.id}.${config.id}`
        existIds.hookIds.onReceiveCommand.add(id)
        if (!this.config.hookIds.onReceiveCommand.find(_config => _config.id === id)) {
          this.config.hookIds.onReceiveCommand.push({ id, enabled: config.defaultEnabled })
        }
      })
    })
    // 3. 如有 plugin 中已经不存在的功能，但 config 中还存在的，需要从 config 中去掉. (embed 须保留)
    ;(['customReplyIds', 'aliasRollIds', 'customTextIds'] as const).forEach(prop => {
      this.config[prop] = this.config[prop].filter(config => config.id.startsWith('io.paotuan.embed') || existIds[prop].has(config.id))
    })
    ;(['onReceiveCommand'] as const).forEach(prop => {
      this.config.hookIds[prop] = this.config.hookIds[prop].filter(config => existIds.hookIds[prop].has(config.id))
    })
  }

  get botOwner() {
    return this.config.botOwner
  }

  /**
   * 默认骰配置
   */
  defaultRoll(card?: ICard) {
    const fromCard = this.config.defaultRoll.preferCard ? card?.defaultRoll : undefined
    return fromCard || this.config.defaultRoll.expression || 'd%'
  }

  /**
   * 特殊指令配置
   */
  get specialDice() {
    return this.config.specialDice
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
    return this.config.customReplyIds
      .filter(item => item.enabled)
      .map(item => this.embedCustomReplyMap[item.id] || this.plugin?.pluginCustomReplyMap[item.id])
      .filter(conf => !!conf)
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
    return this.embedRollDeciderMap[currentId] /* || this.plugin?.pluginRollDeciderMap[currentId] */
  }

  /**
   * 根据当前的规则计算是否成功
   */
  decideRoll(context: IRollDecideContext) {
    return decideRoll(this.rollDecider, context)
  }

  // 子频道 embed 别名指令配置索引
  private get embedAliasRollMap(): Record<string, IAliasRollConfig> {
    const items = this.config.embedPlugin.aliasRoll
    if (!items) return {}
    const embedPluginId = this.config.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  }

  // 子频道别名指令处理器列表
  private get aliasRollProcessors() {
    return this.config.aliasRollIds
      .filter(item => item.enabled)
      .map(item => this.embedAliasRollMap[item.id] || this.plugin?.pluginAliasRollMap[item.id])
  }

  private get aliasRollProcessors_expression() {
    return this.aliasRollProcessors.filter(conf => conf?.scope === 'expression')
  }

  private get aliasRollProcessors_command() {
    return this.aliasRollProcessors.filter(conf => conf?.scope === 'command')
  }

  /**
   * 解析别名指令
   */
  parseAliasRoll_expression(expression: string, context: IDiceRollContext, inlineRolls: InlineDiceRoll[]) {
    return parseAliasForExpression(this.aliasRollProcessors_expression, expression, context, inlineRolls)
  }

  parseAliasRoll_command(command: string) {
    return parseAliasForCommand(this.aliasRollProcessors_command, command)
  }

  // 子频道自定义文案配置
  private get customTextMap() {
    const embed = this.config.embedPlugin.customText?.[0] ?? getEmbedCustomText() // 理论上有且只有一个 embed 配置，但做个兜底
    const pluginList = this.config.customTextIds.filter(item => item.enabled).map(item => this.plugin?.pluginCustomTextMap?.[item.id])
    const validConfigList = [embed, ...pluginList].filter(conf => !!conf) as ICustomTextConfig[]
    // 后面的配置覆盖前面的配置
    return validConfigList.map(config => config.texts).reduce((all, textMap) => Object.assign(all, textMap), {})
  }

  /**
   * 自定义文案格式化
   */
  formatCustomText(key: CustomTextKeys, args: Record<string, any>, context: any) {
    return renderCustomText(this.customTextMap, key, args, context)
  }

  /**
   * 指令兼容大小写
   * 目前的实现是简单粗暴转全小写（引用人物卡的部分本来就不区分大小写，因此只用考虑骰子指令和描述部分）
   * 针对 dF 特殊处理
   */
  convertCase(expression: string) {
    if (this.config.parseRule.convertCase) {
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
    }
    return expression
  }

  /**
   * 智能探测指令中可能出现的 entry/ability 并加上 $ 前缀
   */
  detectCardEntry(expression: string, card?: ICard) {
    // 特殊：【.st力量+1】 st 指令需要排除 // 【.en+侦察】en 也排除
    if (expression.startsWith('st') || expression.startsWith('en')) {
      return expression
    }
    if (this.config.parseRule.detectCardEntry && card) {
      const replacer = (key: string) => {
        if (card.getEntry(key) || card.getAbility(key)) {
          return '$' + key
        } else {
          return key
        }
      }
      return expression.replace(MAYBE_ENTRY_REGEX, replacer).replace(MAYBE_ENTRY_REGEX_AT_START, replacer)
    }
    return expression
  }

  /**
   * 智能探测默认骰参与加减值运算，并替换默认骰为表达式
   */
  detectDefaultRollCalculation(expression: string, card?: ICard) {
    if (this.config.parseRule.detectDefaultRoll) {
      // 纯默认骰不处理，交给原来的逻辑处理
      if (expression.match(DEFAULT_ROLL_REGEX)) return expression
      const defaultRoll = this.defaultRoll(card)
      return expression.replace(MAYBE_INCLUDE_DEFAULT_ROLL_REGEX, () => defaultRoll)
    }
    return expression
  }

  /**
   * 使用 naive 的循环策略解析 inline 和 expression 引用
   * e.g. [[1d3+1]] => (1d3+1); $db => (1d3)
   * 作用是一次性把表达式打平，在掷骰输出时更为简洁明了
   * 缺点是丧失了递归回溯（$1, $2）和 [[1d10]]d10 的拼接能力
   */
  naiveParseInlineRolls(expression: string, card?: ICard) {
    // todo pending，还需要解决直接调用 ability【.徒手格斗】和括号（牺牲准确性换取美观）的功能。后续走插件处理
    if (this.config.parseRule.naiveInlineParseRule) {
      // 替换 entry
      const getEntry = (key: string) => card?.getEntry(key)?.value ?? ''
      const getAbility = (key: string) => card?.getAbility(key)?.value ?? ''
      let depth = 0
      while (ENTRY_REGEX.test(expression)) {
        expression = expression.replace(ENTRY_REGEX, (_, key1: string, key2: string) => {
          const key = key1 ?? key2 ?? ''
          const abilityExpression = getAbility(key)
          if (abilityExpression) {
            return `(${abilityExpression})`
          }
          const skillValue = getEntry(key)
          return String(skillValue ?? '')
        })

        if (++depth > 99) {
          console.error('stackoverflow in naiveParseInlineRolls')
          break
        }
      }
      // 替换 inline roll
      while (INLINE_ROLL_REGEX.test(expression)) {
        expression = expression.replace(INLINE_ROLL_REGEX, (_, notation: string) => `(${notation})`)
      }
    }
    return expression
  }
}

// match 独立出现的疑似人物卡引用（前后不为数字或 $，前向匹配简化了）
const MAYBE_ENTRY_REGEX = /(?<=[+\-*/({])([a-zA-Z\p{Unified_Ideograph}]+)(?![\d$])/gu
const MAYBE_ENTRY_REGEX_AT_START = /^([a-zA-Z\p{Unified_Ideograph}]+)(?=[+\-*/])/gu

// match 疑似默认骰
const DEFAULT_ROLL_REGEX = /^(r|d|rd)$/
const MAYBE_INCLUDE_DEFAULT_ROLL_REGEX = /(?<=^|[+\-*/({])(r|d|rd)(?=$|[+\-*/)}])/g

// match inline roll 和 attribute
const ENTRY_REGEX = /\$\{(.*?)\}|\$([a-zA-Z\p{Unified_Ideograph}]+)/gu // match ${ any content } or $AnyContent
const INLINE_ROLL_REGEX = /\[\[([^[\]]+)]]/ // match [[ any content ]]

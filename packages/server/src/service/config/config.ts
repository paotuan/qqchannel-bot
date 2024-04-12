import type {
  IAliasRollConfig,
  IChannelConfig,
  ICustomReplyConfig,
  ICustomTextConfig,
  IRollDeciderConfig,
  CustomTextKeys, IUserCommand,
  IHookFunction, OnReceiveCommandCallback,
  BeforeParseDiceRollCallback, DiceCommand,
  OnCardEntryChangeCallback, CardEntryChange,
  OnMessageReactionCallback, MessageReaction,
  BeforeDiceRollCallback, AfterDiceRollCallback
} from '@paotuan/types'
import { makeAutoObservable } from 'mobx'
import type { PluginManager } from './plugin'
import { decideRoll, IRollDecideContext } from './helpers/decider'
import type { IDiceRollContext } from '../dice/utils'
import type { InlineDiceRoll } from '../dice/standard/inline'
import { parseAliasForExpression } from './helpers/alias'
import { getEmbedCustomText } from './default'
import { renderCustomText } from './helpers/customText'
import type { ICard } from '@paotuan/card'
import { parseAliasForCommand } from './helpers/aliasCommand'
import { handleHooks, handleHooksAsync, handleLinearHooksAsync, handleVoidHooks } from './helpers/hook'

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
    // 记录一下当前每个功能的 id，用于第三步 purge
    const existIds = {
      customReplyIds: new Set<string>(),
      aliasRollIds: new Set<string>(),
      customTextIds: new Set<string>(),
      hookIds: {
        onReceiveCommand: new Set<string>(),
        beforeParseDiceRoll: new Set<string>(),
        onCardEntryChange: new Set<string>(),
        onMessageReaction: new Set<string>(),
        beforeDiceRoll: new Set<string>(),
        afterDiceRoll: new Set<string>()
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
      ;(['onReceiveCommand', 'beforeParseDiceRoll', 'onCardEntryChange', 'onMessageReaction', 'beforeDiceRoll', 'afterDiceRoll'] as const).forEach(prop => {
        plugin.hook[prop].forEach(config =>{
          const id = `${plugin.id}.${config.id}`
          existIds.hookIds[prop].add(id)
          if (!this.config.hookIds[prop].find(_config => _config.id === id)) {
            this.config.hookIds[prop].push({ id, enabled: config.defaultEnabled })
          }
        })
      })
    })
    // 3. 如有 plugin 中已经不存在的功能，但 config 中还存在的，需要从 config 中去掉. (embed 须保留)
    ;(['customReplyIds', 'aliasRollIds', 'customTextIds'] as const).forEach(prop => {
      this.config[prop] = this.config[prop].filter(config => config.id.startsWith('io.paotuan.embed') || existIds[prop].has(config.id))
    })
    ;(['onReceiveCommand', 'beforeParseDiceRoll', 'onCardEntryChange', 'onMessageReaction', 'beforeDiceRoll', 'afterDiceRoll'] as const).forEach(prop => {
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

  // 子频道 hook 处理器
  private get hookOnReceiveCommandProcessors(): IHookFunction<OnReceiveCommandCallback>[] {
    return this.config.hookIds.onReceiveCommand
      .filter(item => item.enabled)
      .map(item => this.plugin?.hookOnReceiveCommandMap[item.id] as IHookFunction<OnReceiveCommandCallback>)
      .filter(conf => !!conf)
  }

  private get hookBeforeParseDiceRollProcessors(): IHookFunction<BeforeParseDiceRollCallback>[] {
    return this.config.hookIds.beforeParseDiceRoll
      .filter(item => item.enabled)
      .map(item => this.plugin?.hookBeforeParseDiceRollMap[item.id] as IHookFunction<BeforeParseDiceRollCallback>)
      .filter(conf => !!conf)
  }

  private get hookOnCardEntryChangeProcessors(): IHookFunction<OnCardEntryChangeCallback>[] {
    return this.config.hookIds.onCardEntryChange
      .filter(item => item.enabled)
      .map(item => this.plugin?.hookOnCardEntryChangeMap[item.id] as IHookFunction<OnCardEntryChangeCallback>)
      .filter(conf => !!conf)
  }

  private get hookOnMessageReactionProcessors(): IHookFunction<OnMessageReactionCallback>[] {
    return this.config.hookIds.onMessageReaction
      .filter(item => item.enabled)
      .map(item => this.plugin?.hookOnMessageReactionMap[item.id] as IHookFunction<OnMessageReactionCallback>)
      .filter(conf => !!conf)
  }

  private get hookBeforeDiceRollProcessors(): IHookFunction<BeforeDiceRollCallback>[] {
    return this.config.hookIds.beforeDiceRoll
      .filter(item => item.enabled)
      .map(item => this.plugin?.hookBeforeDiceRollMap[item.id] as IHookFunction<BeforeDiceRollCallback>)
      .filter(conf => !!conf)
  }

  private get hookAfterDiceRollProcessors(): IHookFunction<AfterDiceRollCallback>[] {
    return this.config.hookIds.afterDiceRoll
      .filter(item => item.enabled)
      .map(item => this.plugin?.hookAfterDiceRollMap[item.id] as IHookFunction<AfterDiceRollCallback>)
      .filter(conf => !!conf)
  }

  /**
   * Hook 处理
   */
  async hook_onReceiveCommand(result: IUserCommand) {
    console.log('[Hook] 收到指令')
    await handleHooksAsync(this.hookOnReceiveCommandProcessors, result)
  }

  hook_beforeParseDiceRoll(diceCommand: DiceCommand) {
    console.log('[Hook] 解析骰子指令前')
    handleHooks(this.hookBeforeParseDiceRollProcessors, diceCommand)
  }

  hook_onCardEntryChange(e: CardEntryChange) {
    console.log('[Hook] 人物卡数值变化')
    handleVoidHooks(this.hookOnCardEntryChangeProcessors, e)
  }

  hook_onMessageReaction(e: MessageReaction) {
    console.log('[Hook] 收到表情表态')
    return handleLinearHooksAsync(this.hookOnMessageReactionProcessors, e)
  }

  hook_beforeDiceRoll(roll: unknown) {
    console.log('[Hook] 掷骰/检定前')
    handleHooks(this.hookBeforeDiceRollProcessors, roll)
  }

  hook_afterDiceRoll(roll: unknown) {
    console.log('[Hook] 掷骰/检定后')
    handleVoidHooks(this.hookAfterDiceRollProcessors, roll)
  }
}

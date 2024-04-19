import type { ICard } from '@paotuan/card'
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
} from '@paotuan/config'
import { decideRoll, IRollDecideContext } from './helpers/decider'
import type { IDiceRollContext } from '../dice/utils'
import type { InlineDiceRoll } from '../dice/standard/inline'
import { parseAliasForExpression } from './helpers/alias'
import { getEmbedCustomText } from './default'
import { renderCustomText } from './helpers/customText'
import { parseAliasForCommand } from './helpers/aliasCommand'
import { handleHooks, handleHooksAsync, handleLinearHooksAsync, handleVoidHooks } from './helpers/hook'
import { PluginProvider } from './plugin-provider'
import { upgradeConfig } from './migration/upgrade'
import { updateConfigByPlugin } from './migration/updateByPlugin'

// 频道配置文件封装
export class ChannelConfig {
  readonly config: IChannelConfig

  constructor(config: IChannelConfig) {
    this.config = updateConfigByPlugin(upgradeConfig(config))
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
      .map(item => this.embedCustomReplyMap[item.id] || PluginProvider.INSTANCE.getPluginItem<ICustomReplyConfig>(item.id))
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
      .map(item => this.embedAliasRollMap[item.id] || PluginProvider.INSTANCE.getPluginItem<IAliasRollConfig>(item.id))
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
    const pluginList = this.config.customTextIds.filter(item => item.enabled).map(item => PluginProvider.INSTANCE.getPluginItem<ICustomTextConfig>(item.id))
    const validConfigList = [embed, ...pluginList].filter(conf => !!conf)
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
  private getHookProcessors<T>(prop: keyof IChannelConfig['hookIds']): IHookFunction<T>[] {
    return this.config.hookIds[prop]
      .filter(item => item.enabled)
      .map(item => PluginProvider.INSTANCE.getPluginItem<IHookFunction<T>>(item.id))
      .filter(conf => !!conf)
  }

  /**
   * Hook 处理
   */
  async hook_onReceiveCommand(result: IUserCommand) {
    console.log('[Hook] 收到指令')
    await handleHooksAsync(this.getHookProcessors<OnReceiveCommandCallback>('onReceiveCommand'), result)
  }

  hook_beforeParseDiceRoll(diceCommand: DiceCommand) {
    console.log('[Hook] 解析骰子指令前')
    handleHooks(this.getHookProcessors<BeforeParseDiceRollCallback>('beforeParseDiceRoll'), diceCommand)
  }

  hook_onCardEntryChange(e: CardEntryChange) {
    console.log('[Hook] 人物卡数值变化')
    handleVoidHooks(this.getHookProcessors<OnCardEntryChangeCallback>('onCardEntryChange'), e)
  }

  hook_onMessageReaction(e: MessageReaction) {
    console.log('[Hook] 收到表情表态')
    return handleLinearHooksAsync(this.getHookProcessors<OnMessageReactionCallback>('onMessageReaction'), e)
  }

  hook_beforeDiceRoll(roll: unknown) {
    console.log('[Hook] 掷骰/检定前')
    handleHooks(this.getHookProcessors<BeforeDiceRollCallback>('beforeDiceRoll'), roll)
  }

  hook_afterDiceRoll(roll: unknown) {
    console.log('[Hook] 掷骰/检定后')
    handleVoidHooks(this.getHookProcessors<AfterDiceRollCallback>('afterDiceRoll'), roll)
  }
}

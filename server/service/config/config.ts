import type { IChannelConfig, ICustomReplyConfig, IRollDeciderConfig } from '../../../interface/config'
import { makeAutoObservable } from 'mobx'
import type { PluginManager } from './plugin'
import { decideRoll, IRollDecideContext } from './helpers/decider'

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
  decideRoll(context: IRollDecideContext) {
    return decideRoll(this.rollDecider, context)
  }
}

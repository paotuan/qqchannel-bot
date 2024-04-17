import type { IPlugin } from '@paotuan/config'
import { eventBus } from '../eventBus'

type PluginId = string
type PluginFullId = `${PluginId}.${string}`

export class PluginProvider {
  static readonly INSTANCE = new PluginProvider()

  private readonly pluginMap = new Map<PluginId, IPlugin>()
  private readonly pluginId2ItemIds = new Map<PluginId, Set<PluginFullId>>()
  private readonly itemsMap = new Map<PluginFullId, unknown>()

  private constructor() {
  }

  get allPlugins() {
    return Array.from(this.pluginMap.values())
  }

  register(plugins: IPlugin[]) {
    for (const plugin of plugins) {
      this._register(plugin.id, plugin)
    }
    eventBus.emit('plugins-added', plugins)
  }

  private _register(pluginId: string, plugin: IPlugin) {
    if (this.pluginMap.has(pluginId)) {
      this._unregister(pluginId)
    }
    this.pluginMap.set(pluginId, plugin)
    // 把所有 item 打平存储
    const allIds = new Set<PluginFullId>()
    ;(['customReply', 'rollDecider', 'aliasRoll', 'customText'] as const).forEach(key => {
      plugin[key]?.forEach(item => {
        const fullId: PluginFullId = `${plugin.id}.${item.id}`
        allIds.add(fullId)
        this.itemsMap.set(fullId, item)
      })
    })
    ;(['onReceiveCommand', 'beforeParseDiceRoll', 'onCardEntryChange', 'onMessageReaction', 'beforeDiceRoll', 'afterDiceRoll'] as const).forEach(key => {
      plugin.hook?.[key]?.forEach(item => {
        const fullId: PluginFullId = `${plugin.id}.${item.id}`
        allIds.add(fullId)
        this.itemsMap.set(fullId, item)
      })
    })
    this.pluginId2ItemIds.set(pluginId, allIds)
  }

  private _unregister(pluginId: string) {
    const itemIds = this.pluginId2ItemIds.get(pluginId)
    if (itemIds) {
      itemIds.forEach(id => this.itemsMap.delete(id))
    }
    this.pluginId2ItemIds.delete(pluginId)
    this.pluginMap.delete(pluginId)
  }

  // 调用方保证类型正确
  getPluginItem<T>(fullId: string) {
    return this.itemsMap.get(fullId as PluginFullId) as T
  }
}

// 提供给外部
export function registerPlugins(plugins: IPlugin[]) {
  PluginProvider.INSTANCE.register(plugins)
}

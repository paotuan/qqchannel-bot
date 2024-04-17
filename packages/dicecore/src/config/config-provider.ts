import type { IChannelConfig } from '@paotuan/config'
import { ChannelConfig } from './config'
import { eventBus } from '../eventBus'
import { getInitialDefaultConfig } from './default'

type IdOrDefault = string | 'default'

export class ConfigProvider {
  static readonly INSTANCE = new ConfigProvider()

  private readonly configMap = new Map<IdOrDefault, ChannelConfig>()

  private constructor() {
    eventBus.on('plugins-added', () => this._updateByPlugin())
  }

  // 插件更新后，重新更新配置
  private _updateByPlugin() {
    for (const [id, channelConfig] of this.configMap.entries()) {
      this.register(id, channelConfig.config)
    }
  }

  register(id: IdOrDefault, config: IChannelConfig) {
    this.configMap.set(id, new ChannelConfig(config))
  }

  unregister(id: IdOrDefault) {
    this.configMap.delete(id)
  }

  get defaultConfig() {
    if (!this.configMap.has('default')) {
      this.register('default', getInitialDefaultConfig())
    }
    return this.configMap.get('default')!
  }

  getConfig(id: string) {
    return this.configMap.get(id) || this.defaultConfig
  }
}

// 提供给外部
export function registerConfig(id: IdOrDefault, config: IChannelConfig) {
  ConfigProvider.INSTANCE.register(id, config)
}

export function unregisterConfig(id: IdOrDefault) {
  ConfigProvider.INSTANCE.unregister(id)
}

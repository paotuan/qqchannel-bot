import { ChannelUnionId } from '../adapter/utils'
import { ConfigProvider } from '@paotuan/dicecore'
import { cloneDeep } from 'lodash'
import { GlobalStore } from '../state'

export class ConfigManager {

  getChannelConfig(channelUnionId: ChannelUnionId | 'default') {
    return ConfigProvider.getConfig(channelUnionId)
  }

  setDefaultChannelConfig(channelUnionId: ChannelUnionId) {
    console.log('[Config] 保存为默认配置', channelUnionId)
    const configData = cloneDeep(this.getChannelConfig(channelUnionId).config)
    const global = GlobalStore.Instance.globalState
    global.defaultConfig.current = configData
    ConfigProvider.register('default', global.defaultConfig.current)
  }

  resetChannelConfig(channelUnionId: ChannelUnionId) {
    console.log('[Config] 重置为默认配置')
    const defaultConfigData = cloneDeep(this.getChannelConfig('default').config)
    const channelState = GlobalStore.Instance.channel(channelUnionId)
    channelState.config.current = defaultConfigData
    ConfigProvider.register(channelUnionId, channelState.config.current)
  }
}

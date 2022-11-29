import type { IAliasRollConfig, IChannelConfig } from '../../../interface/config'
import { computed, ComputedRef } from 'vue'
import { nanoid } from 'nanoid/non-secure'

export function useAliasRoll(config: ComputedRef<IChannelConfig | null>) {
  // @private embed alias roll 索引表 fullId -> config
  const embedAliasRollMap = computed<Record<string, IAliasRollConfig>>(() => {
    const items = config.value?.embedPlugin.aliasRoll
    if (!items) return {}
    const embedPluginId = config.value.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  })

  // 根据 full id 获取 reply config
  const getAliasRollProcessor = (fullId: string) => {
    // todo 插件情况，信息可能不全
    return embedAliasRollMap.value[fullId]
  }

  // 删除某条 config
  const deleteAliasRollConfig = (fullId: string) => {
    if (!config.value) return
    // 删除 id
    const index = config.value!.aliasRollIds.findIndex(item => item.id === fullId)
    if (index >= 0) {
      config.value!.aliasRollIds.splice(index, 1)
    }
    // 如果是 embed plugin，则删除 embed plugin 中的内容
    const embedPlugin = config.value!.embedPlugin
    if (fullId.startsWith(embedPlugin.id)) {
      const embedPluginIndex = embedPlugin.aliasRoll?.findIndex(item => `${embedPlugin.id}.${item.id}` === fullId)
      if (typeof embedPluginIndex !== 'undefined' && embedPluginIndex >= 0) {
        config.value!.embedPlugin.aliasRoll!.splice(embedPluginIndex, 1)
      }
    }
  }

  // 编辑某条 config 的标题和描述
  const editAliasRollConfig = (fullId: string, name: string, desc: string) => {
    const oldConfig = getAliasRollProcessor(fullId)
    if (oldConfig) {
      oldConfig.name = name
      oldConfig.description = desc
    }
  }

  // 新增 embed config
  const newEmbedAliasRollConfig = (name: string, desc: string) => {
    if (!config.value) return
    const newConfig: IAliasRollConfig = {
      id: nanoid(),
      name: name,
      description: desc,
      command: '',
      trigger: 'naive',
      replacer: ''
    }
    // 写入 embed 插件
    const plugin = config.value!.embedPlugin
    if (!plugin.aliasRoll) {
      plugin.aliasRoll = []
    }
    plugin.aliasRoll.push(newConfig)
    // 默认选中该插件
    config.value!.aliasRollIds.push({ id: `${plugin.id}.${newConfig.id}`, enabled: true })
  }

  return {
    getAliasRollProcessor,
    deleteAliasRollConfig,
    editAliasRollConfig,
    newEmbedAliasRollConfig
  }
}

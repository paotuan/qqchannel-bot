import type { IChannelConfig, ICustomReplyConfig } from '../../../interface/config'
import { computed, ComputedRef } from 'vue'
import { nanoid } from 'nanoid/non-secure'

export function useCustomReply(config: ComputedRef<IChannelConfig | null>) {
  // @private embed custom reply 索引表 fullId -> config
  const embedCustomReplyMap = computed<Record<string, ICustomReplyConfig>>(() => {
    const items = config.value?.embedPlugin.customReply
    if (!items) return {}
    const embedPluginId = config.value.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  })

  // 根据 full id 获取 reply config
  const getCustomReplyProcessor = (fullId: string) => {
    return embedCustomReplyMap.value[fullId]
  }

  // 删除某条 config
  const deleteCustomReplyConfig = (fullId: string) => {
    if (!config.value) return
    // 删除 id
    const index = config.value!.customReplyIds.findIndex(item => item.id === fullId)
    if (index >= 0) {
      config.value!.customReplyIds.splice(index, 1)
    }
    // 如果是 embed plugin，则删除 embed plugin 中的内容
    const embedPlugin = config.value!.embedPlugin
    if (fullId.startsWith(embedPlugin.id)) {
      const embedPluginIndex = embedPlugin.customReply?.findIndex(item => `${embedPlugin.id}.${item.id}` === fullId)
      if (typeof embedPluginIndex !== 'undefined' && embedPluginIndex >= 0) {
        config.value!.embedPlugin.customReply!.splice(embedPluginIndex, 1)
      }
    }
  }

  // 编辑某条 config 的标题和描述
  const editCustomReplyConfig = (fullId: string, name: string, desc: string) => {
    const oldConfig = getCustomReplyProcessor(fullId)
    if (oldConfig) {
      oldConfig.name = name
      oldConfig.description = desc
    }
  }

  // 新增 embed config
  const newEmbedCustomReplyConfig = (name: string, desc: string) => {
    if (!config.value) return
    const newConfig: ICustomReplyConfig = {
      id: nanoid(),
      name: name,
      description: desc,
      command: '',
      trigger: 'exact',
      items: [{ weight: 1, reply: '' }]
    }
    // 写入 embed 插件
    const plugin = config.value!.embedPlugin
    if (!plugin.customReply) {
      plugin.customReply = []
    }
    plugin.customReply.push(newConfig)
    // 默认选中该插件
    config.value!.customReplyIds.push({ id: `${plugin.id}.${newConfig.id}`, enabled: true })
  }

  return {
    getCustomReplyProcessor,
    deleteCustomReplyConfig,
    editCustomReplyConfig,
    newEmbedCustomReplyConfig
  }
}

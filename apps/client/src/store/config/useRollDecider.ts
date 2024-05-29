import { computed, ComputedRef } from 'vue'
import type { IChannelConfig, IRollDeciderConfig } from '@paotuan/config'
import { nanoid } from 'nanoid/non-secure'

export function useRollDecider(config: ComputedRef<IChannelConfig | null>) {
  // @private embed roll decider 索引表 fullId -> config
  const embedRollDeciderMap = computed<Record<string, IRollDeciderConfig>>(() => {
    const items = config.value?.embedPlugin.rollDecider
    if (!items) return {}
    const embedPluginId = config.value.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  })

  // 根据 full id 获取 roll decider
  const getRollDeciderConfig = (fullId: string) => {
    return embedRollDeciderMap.value[fullId]
  }

  // 删除某条 config
  const deleteRollDeciderConfig = (fullId: string) => {
    if (!config.value) return
    // 删除 id
    const index = config.value!.rollDeciderIds.findIndex(id => id === fullId)
    if (index >= 0) {
      config.value!.rollDeciderIds.splice(index, 1)
    }
    // 如果删除的正是当前选中的 id，就重置当前选中的规则为空
    if (fullId === config.value!.rollDeciderId) {
      config.value!.rollDeciderId = ''
    }
    // 如果是 embed plugin，则删除 embed plugin 中的内容
    const embedPlugin = config.value!.embedPlugin
    if (fullId.startsWith(embedPlugin.id)) {
      const embedPluginIndex = embedPlugin.rollDecider?.findIndex(item => `${embedPlugin.id}.${item.id}` === fullId)
      if (typeof embedPluginIndex !== 'undefined' && embedPluginIndex >= 0) {
        config.value!.embedPlugin.rollDecider!.splice(embedPluginIndex, 1)
      }
    }
  }

  // 编辑某条 config 的标题和描述
  const editRollDeciderConfig = (fullId: string, name: string, desc: string) => {
    const oldConfig = getRollDeciderConfig(fullId)
    if (oldConfig) {
      oldConfig.name = name
      oldConfig.description = desc
    }
  }

  // 新增 embed config
  const newEmbedRollDeciderConfig = (name: string, desc: string) => {
    if (!config.value) return
    const newConfig: IRollDeciderConfig = {
      id: nanoid(),
      name: name,
      description: desc,
      rules: [
        { level: '大失败', expression: '' },
        { level: '大成功', expression: '' },
        { level: '失败', expression: '' },
        { level: '极难成功', expression: ''},
        { level: '困难成功', expression: '' },
        { level: '成功', expression: '' }
      ]
    }
    // 写入 embed 插件
    const plugin = config.value!.embedPlugin
    if (!plugin.rollDecider) {
      plugin.rollDecider = []
    }
    plugin.rollDecider.push(newConfig)
    // 使该插件在列表中展示
    config.value!.rollDeciderIds.push(`${plugin.id}.${newConfig.id}`)
  }

  // 当前选择的规则 id
  const currentRollDeciderId = computed({
    get() {
      return config.value!.rollDeciderId
    },
    set(fullId: string) {
      config.value!.rollDeciderId = fullId
    }
  })

  return {
    getRollDeciderConfig,
    deleteRollDeciderConfig,
    editRollDeciderConfig,
    newEmbedRollDeciderConfig,
    currentRollDeciderId
  }
}

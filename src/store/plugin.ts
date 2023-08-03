import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { IPluginConfigDisplay } from '../../interface/common'

export interface IPluginItemConfigForDisplay {
  id: string // fullId
  name: string
  description: string
  fromPlugin: string // 标识插件名字，用于展示
}

export type PluginItemType = 'customReply' | 'rollDecider' | 'aliasRoll' | 'customText'

export const usePluginStore = defineStore('plugin', () => {
  const plugins = ref<IPluginConfigDisplay[]>([])

  // @private fullId => config
  const plugin2map = (type: PluginItemType) => {
    const map: Record<string, IPluginItemConfigForDisplay> = {}
    plugins.value.forEach(plugin => {
      plugin[type].forEach(item => {
        const id = `${plugin.id}.${item.id}`
        map[id] = {
          id,
          name: item.name,
          description: item.description || '',
          fromPlugin: plugin.name
        }
      })
    })
    return map
  }

  const customReplyMap = computed(() => plugin2map('customReply'))
  const rollDeciderMap = computed(() => plugin2map('rollDecider'))
  const aliasRollMap = computed(() => plugin2map('aliasRoll'))
  const customTextMap = computed(() => plugin2map('customText'))

  const getPluginCustomReplyProcessor = (fullId: string) => {
    return customReplyMap.value[fullId]
  }

  const getPluginRollDeciderConfig = (fullId: string) => {
    return rollDeciderMap.value[fullId]
  }

  const getPluginAliasRollProcessor = (fullId: string) => {
    return aliasRollMap.value[fullId]
  }

  const getCustomTextProcessor = (fullId: string) => {
    return customTextMap.value[fullId]
  }

  const onGetPlugins = (data: IPluginConfigDisplay[]) => {
    plugins.value = data
  }

  return {
    customReplyMap,
    rollDeciderMap,
    aliasRollMap,
    customTextMap,
    getPluginCustomReplyProcessor,
    getPluginRollDeciderConfig,
    getPluginAliasRollProcessor,
    getCustomTextProcessor,
    onGetPlugins
  }
})

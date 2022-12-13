import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { IPluginConfigDisplay } from '../../interface/common'

export interface IPluginItemConfigForDisplay {
  id: string // fullId
  name: string
  description: string // + 来自插件 xxx
  fromPlugin: true // 标识是插件
}

export const usePluginStore = defineStore('plugin', () => {
  const plugins = ref<IPluginConfigDisplay[]>([])

  // @private fullId => config
  const plugin2map = (type: 'customReply' | 'rollDecider' | 'aliasRoll') => {
    const map: Record<string, IPluginItemConfigForDisplay> = {}
    plugins.value.forEach(plugin => {
      plugin[type].forEach(item => {
        const id = `${plugin.id}.${item.id}`
        map[id] = {
          id,
          name: item.name,
          description: `${item.description || ''} (来自 ${plugin.name})`,
          fromPlugin: true
        }
      })
    })
    return map
  }

  const customReplyMap = computed(() => plugin2map('customReply'))
  const rollDeciderMap = computed(() => plugin2map('rollDecider'))
  const aliasRollMap = computed(() => plugin2map('aliasRoll'))

  const getPluginCustomReplyProcessor = (fullId: string) => {
    console.log(customReplyMap.value)
    return customReplyMap.value[fullId]
  }

  const getPluginRollDeciderConfig = (fullId: string) => {
    return rollDeciderMap.value[fullId]
  }

  const getPluginAliasRollProcessor = (fullId: string) => {
    return aliasRollMap.value[fullId]
  }

  const onGetPlugins = (data: IPluginConfigDisplay[]) => {
    plugins.value = data
  }

  return {
    getPluginCustomReplyProcessor,
    getPluginRollDeciderConfig,
    getPluginAliasRollProcessor,
    onGetPlugins
  }
})

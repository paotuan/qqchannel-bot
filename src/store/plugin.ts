import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { IPluginConfigDisplay } from '../../interface/common'
import type { HookModule } from '../views/ConfigPanel/hook/types'

export interface IPluginItemConfigForDisplay {
  id: string // fullId
  name: string
  description: string
  fromPlugin: string // 标识插件名字，用于展示
}

export type PluginItemType = 'customReply' | 'rollDecider' | 'aliasRoll' | 'customText'

export const usePluginStore = defineStore('plugin', () => {
  const plugins = ref<IPluginConfigDisplay[]>([])

  const getPlugin = (fullId: string) => {
    return plugins.value.find(plugin => plugin.id === fullId)
  }

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

  const hooksMap = computed(() => {
    const map: Record<HookModule, Record<string, IPluginItemConfigForDisplay>> = {
      onReceiveCommand: {},
      beforeParseDiceRoll: {},
      onCardEntryChange: {},
      onMessageReaction: {},
      beforeDiceRoll: {},
      afterDiceRoll: {}
    }
    const hookTypes = Object.keys(map) as HookModule[]
    plugins.value.forEach(plugin => {
      hookTypes.forEach(type => {
        plugin.hook[type].forEach(item => {
          const id = `${plugin.id}.${item.id}`
          map[type][id] = {
            id,
            name: item.name,
            description: item.description || '',
            fromPlugin: plugin.name
          }
        })
      })
    })
    return map
  })

  const getHookProcessor = (module: HookModule, fullId: string) => {
    return hooksMap.value[module][fullId]
  }

  const onGetPlugins = (data: IPluginConfigDisplay[]) => {
    plugins.value = data
  }

  return {
    customReplyMap,
    rollDeciderMap,
    aliasRollMap,
    customTextMap,
    getPlugin,
    getPluginCustomReplyProcessor,
    getPluginRollDeciderConfig,
    getPluginAliasRollProcessor,
    getCustomTextProcessor,
    getHookProcessor,
    onGetPlugins
  }
})

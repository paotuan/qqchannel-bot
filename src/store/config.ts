import { defineStore } from 'pinia'
import type { IChannelConfig, ICustomReplyConfig } from '../../interface/config'
import { computed, reactive, ref, watch } from 'vue'
import ws from '../api/ws'
import type { IChannelConfigReq } from '../../interface/common'

export const useConfigStore = defineStore('config', () => {
  const state = reactive({ config: null as IChannelConfig | null })
  const edited = ref(false)

  // 获取 config
  const config = computed(() => state.config)
  watch(
    () => state.config,
    () => edited.value = true,
    { deep: true }
  )

  // 获取 自定义回复
  const embedCustomReplyMap = computed<Record<string, ICustomReplyConfig>>(() => {
    const items = config.value?.embedPlugin.customReply
    if (!items) return false
    const embedPluginId = config.value.embedPlugin.id
    return items.reduce((obj, item) => Object.assign(obj, { [`${embedPluginId}.${item.id}`]: item }), {})
  })
  const getCustomReplyProcessor = (id: string) => {
    // todo 插件情况，信息可能不全
    return embedCustomReplyMap.value[id]
  }

  // 接收从服务端的 config 更新。就不按照时间戳判断了
  const onUpdateConfig = (config: IChannelConfig) => {
    state.config = config
    edited.value = false
  }

  // 保存配置
  const requestSaveConfig = (setDefault: boolean) => {
    if (!config.value) return
    ws.send<IChannelConfigReq>({ cmd: 'channel/config', data: { config: config.value, setDefault } })
  }

  // 重置配置
  const requestResetConfig = () => {
    ws.send<null>({ cmd: 'channel/config/reset', data: null })
  }

  return {
    config,
    edited,
    getCustomReplyProcessor,
    onUpdateConfig,
    requestSaveConfig,
    requestResetConfig
  }
})

import { defineStore } from 'pinia'
import type { IChannelConfig } from '../../interface/config'
import { computed, reactive, ref, watch } from 'vue'
import ws from '../api/ws'
import type { IChannelConfigReq } from '../../interface/common'

export const useConfigStore = defineStore('config', () => {
  const state = reactive({ config: null as IChannelConfig | null })
  const edited = ref(false)

  const config = computed(() => state.config)
  watch(
    () => state.config,
    () => edited.value = true,
    { deep: true }
  )

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
    onUpdateConfig,
    requestSaveConfig,
    requestResetConfig
  }
})

import { defineStore } from 'pinia'
import type { IChannelConfig } from '../../../interface/config'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import ws from '../../api/ws'
import type { IChannelConfigReq } from '../../../interface/common'
import { useCustomReply } from './useCustomReply'
import { gtagEvent } from '../../utils'
import { useRollDecider } from './useRollDecider'
import { useAliasRoll } from './useAliasRoll'

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

  // 接收从服务端的 config 更新。就不按照时间戳判断了
  const onUpdateConfig = (config: IChannelConfig) => {
    state.config = config
    nextTick(() => {
      edited.value = false
    })
  }

  // 保存配置
  const requestSaveConfig = (setDefault: boolean) => {
    if (!config.value) return
    ws.send<IChannelConfigReq>({ cmd: 'channel/config', data: { config: config.value, setDefault } })
    gtagEvent('config/save')
  }

  // 重置配置
  const requestResetConfig = () => {
    ws.send<null>({ cmd: 'channel/config/reset', data: null })
    gtagEvent('config/reset')
  }

  // 自定义回复相关功能
  const customReplyApis = useCustomReply(config)
  // 自定义规则相关功能
  const rollDeciderApis = useRollDecider(config)
  // 别名指令相关功能
  const aliasRollApis = useAliasRoll(config)

  // 快捷设置
  const quickSet = (mode: 'coc' | 'dnd') => {
    const config = state.config
    if (!config) return
    // 默认骰
    config.defaultRoll.expression = mode === 'coc' ? 'd100' : 'd20'
    // 规则
    const ruleId = config.embedPlugin.id + (mode === 'coc' ? '.coc0' : '.dnd0')
    const ruleExist = config.rollDeciderIds.includes(ruleId)
    if (ruleExist) {
      config.rollDeciderId = ruleId
    }
    // 特殊指令
    // config.specialDice.opposeDice.refineSuccessLevels = mode === 'coc'
    // config.specialDice.riDice.baseRoll = mode === 'coc' ? '$敏捷' : 'd20'
    config.specialDice.scDice.enabled = mode === 'coc'
    config.specialDice.enDice.enabled = mode === 'coc'
    config.specialDice.dsDice.enabled = mode === 'dnd'
  }

  return {
    config,
    edited,
    onUpdateConfig,
    requestSaveConfig,
    requestResetConfig,
    ...customReplyApis,
    ...rollDeciderApis,
    ...aliasRollApis,
    quickSet
  }
})

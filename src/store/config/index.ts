import { defineStore } from 'pinia'
import type { IChannelConfig } from '../../../interface/config'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import ws from '../../api/ws'
import type { IChannelConfigReq } from '../../../interface/common'
import { useCustomReply } from './useCustomReply'
import { gtagEvent } from '../../utils'
import { useRollDecider } from './useRollDecider'
import { useAliasRoll } from './useAliasRoll'
import { useCustomText } from './useCustomText'

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
  // 自定义文案相关功能
  const customTextApis = useCustomText(config)

  // 快捷设置
  const quickSet = (mode: 'coc' | 'dnd') => {
    const config = state.config
    if (!config) return
    // 默认骰
    config.defaultRoll.expression = mode === 'coc' ? 'd100' : 'd20'
    // 规则
    const ruleId = mode === 'coc' ? 'io.paotuan.embed.coc0' : 'io.paotuan.embed.dnd0'
    const ruleExist = config.rollDeciderIds.includes(ruleId)
    if (ruleExist) {
      config.rollDeciderId = ruleId
    }
    // 别名指令
    // const aliasRollIds = {
    //   toEnable: [
    //     mode === 'coc' ? 'io.paotuan.embed.rb' : 'io.paotuan.embed.advantage',
    //     mode === 'coc' ? 'io.paotuan.embed.rp' : 'io.paotuan.embed.disadvantage'
    //   ],
    //   toDisable: [
    //     mode === 'dnd' ? 'io.paotuan.embed.rb' : 'io.paotuan.embed.advantage',
    //     mode === 'dnd' ? 'io.paotuan.embed.rp' : 'io.paotuan.embed.disadvantage',
    //     'io.paotuan.embed.wwa',
    //     'io.paotuan.embed.ww'
    //   ]
    // }
    // ;(['toEnable', 'toDisable'] as const).forEach(prop => {
    //   aliasRollIds[prop].forEach(id => {
    //     const conf = config.aliasRollIds.find(c => c.id === id)
    //     if (conf) {
    //       conf.enabled = prop === 'toEnable'
    //     }
    //   })
    // })
    // 自定义回复
    // const _customReplyCocOnly = [
    //   'io.paotuan.plugin.insane.ti',
    //   'io.paotuan.plugin.insane.li',
    //   'io.paotuan.plugin.insane.phobia',
    //   'io.paotuan.plugin.insane.mania',
    // ]
    // const customReplyIds = {
    //   toEnable: [
    //     mode === 'coc' ? 'io.paotuan.plugin.cardgen.coc' : 'io.paotuan.plugin.cardgen.dnd',
    //     ...(mode === 'coc' ? _customReplyCocOnly : [])
    //   ],
    //   toDisable: [
    //     mode === 'dnd' ? 'io.paotuan.plugin.cardgen.coc' : 'io.paotuan.plugin.cardgen.dnd',
    //     ...(mode === 'dnd' ? _customReplyCocOnly : [])
    //   ]
    // }
    // ;(['toEnable', 'toDisable'] as const).forEach(prop => {
    //   customReplyIds[prop].forEach(id => {
    //     const conf = config.customReplyIds.find(c => c.id === id)
    //     if (conf) {
    //       conf.enabled = prop === 'toEnable'
    //     }
    //   })
    // })
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
    ...customTextApis,
    quickSet
  }
})

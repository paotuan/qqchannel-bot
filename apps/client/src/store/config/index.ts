import { defineStore } from 'pinia'
import { computed } from 'vue'
import ws from '../../api/ws'
import { useCustomReply } from './useCustomReply'
import { gtagEvent, Toast } from '../../utils'
import { useRollDecider } from './useRollDecider'
import { useAliasRoll } from './useAliasRoll'
import { useCustomText } from './useCustomText'
import { yChannelStoreRef } from '../ystore'

export const useConfigStore = defineStore('config', () => {
  // 获取 config
  const config = computed(() => yChannelStoreRef.value?.config.current ?? null)

  // 设为默认配置
  const requestSetDefault = () => {
    ws.send<null>({ cmd: 'channel/config/default', data: null })
    gtagEvent('config/setDefault')
    Toast.success('操作成功')
  }

  // 重置配置
  const requestResetConfig = () => {
    ws.send<null>({ cmd: 'channel/config/reset', data: null })
    gtagEvent('config/reset')
    Toast.success('操作成功')
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
    const _config = config.value
    if (!_config) return
    // 默认骰
    _config.defaultRoll.expression = mode === 'coc' ? 'd100' : 'd20'
    // 规则
    const ruleId = mode === 'coc' ? 'io.paotuan.embed.coc0' : 'io.paotuan.embed.dnd0'
    const ruleExist = _config.rollDeciderIds.includes(ruleId)
    if (ruleExist) {
      _config.rollDeciderId = ruleId
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
    _config.specialDice.scDice.enabled = mode === 'coc'
    _config.specialDice.enDice.enabled = mode === 'coc'
    _config.specialDice.dsDice.enabled = mode === 'dnd'
  }

  return {
    config,
    requestSetDefault,
    requestResetConfig,
    ...customReplyApis,
    ...rollDeciderApis,
    ...aliasRollApis,
    ...customTextApis,
    quickSet
  }
})

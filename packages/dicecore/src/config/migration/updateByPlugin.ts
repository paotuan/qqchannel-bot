import type { IChannelConfig } from '@paotuan/config'
import { PluginProvider } from '../plugin-provider'


// 确保某个 plugin 在配置中存在
function _ensurePluginConfig(config: IChannelConfig, pluginId: string) {
  const pluginConfig = config.plugins.find(_plugin => _plugin.id === pluginId)
  if (pluginConfig) {
    return pluginConfig
  }
  // 新增的 plugins 默认启用
  const newPluginConfig = { id: pluginId, enabled: true, preference: {} }
  config.plugins.push(newPluginConfig)
  // 如果是新增的 plugin，不能直接返回 pluginConfig，应该是因为内部做了代理，要返回代理后的对象
  // 否则后面对 config 的修改会不生效
  return config.plugins.find(_plugin => _plugin.id === pluginId)!
}

/**
 * 根据当前注册的插件，把插件里的各个项目开启状态保存到 config 对象中，用于：
 * 1. 新增的插件自动开启，移除的插件自动关闭
 * 2. 供给前端用于表单双向绑定
 * 这个方法会改变 config 对象
 */
export function updateConfigByPlugin(config: IChannelConfig) {
  const manifest = PluginProvider.INSTANCE.allPlugins
  // 记录一下当前每个功能的 id，用于第三步 purge
  const existIds = {
    customReplyIds: new Set<string>(),
    aliasRollIds: new Set<string>(),
    customTextIds: new Set<string>(),
    hookIds: {
      onReceiveCommand: new Set<string>(),
      beforeParseDiceRoll: new Set<string>(),
      onCardEntryChange: new Set<string>(),
      onMessageReaction: new Set<string>(),
      beforeDiceRoll: new Set<string>(),
      afterDiceRoll: new Set<string>()
    }
  }
  manifest.forEach(plugin => {
    // 0. 确保 plugin 在配置中存在
    const pluginConfig = _ensurePluginConfig(config, plugin.id)
    // 1. 写入/更新 preference，确保 preference 的 key 在配置中存在，以便在前端双向绑定
    const preference: Record<string, string> = {}
    plugin.preference?.forEach(pref => {
      preference[pref.key] = pluginConfig.preference[pref.key] ?? pref.defaultValue
    })
    pluginConfig.preference = preference
    // 2. 处理 plugin 内每个功能的开启状态
    // 如果是 disabled 状态的 plugin，不处理. disabled 状态的 plugin 下所有功能都应该不存在，不出现在 config 里
    if (!pluginConfig.enabled) return
    plugin.customReply?.forEach(item => {
      const id = `${plugin.id}.${item.id}`
      existIds.customReplyIds.add(id)
      if (!config.customReplyIds.find(_config => _config.id === id)) {
        config.customReplyIds.push({ id, enabled: item.defaultEnabled ?? true })
      }
    })
    // rollDecider 先忽略
    plugin.aliasRoll?.forEach(item => {
      const id = `${plugin.id}.${item.id}`
      existIds.aliasRollIds.add(id)
      if (!config.aliasRollIds.find(_config => _config.id === id)) {
        config.aliasRollIds.push({ id, enabled: item.defaultEnabled ?? true })
      }
    })
    plugin.customText?.forEach(item => {
      const id = `${plugin.id}.${item.id}`
      existIds.customTextIds.add(id)
      if (!config.customTextIds.find(_config => _config.id === id)) {
        config.customTextIds.push({ id, enabled: item.defaultEnabled ?? true })
      }
    })
    ;(['onReceiveCommand', 'beforeParseDiceRoll', 'onCardEntryChange', 'onMessageReaction', 'beforeDiceRoll', 'afterDiceRoll'] as const).forEach(prop => {
      plugin.hook?.[prop]?.forEach(item =>{
        const id = `${plugin.id}.${item.id}`
        existIds.hookIds[prop].add(id)
        if (!config.hookIds[prop].find(_config => _config.id === id)) {
          config.hookIds[prop].push({ id, enabled: item.defaultEnabled ?? true })
        }
      })
    })
  })
  // 3. 如有 plugin 中已经不存在的功能，但 config 中还存在的，需要从 config 中去掉. (embed 须保留)
  ;(['customReplyIds', 'aliasRollIds', 'customTextIds'] as const).forEach(prop => {
    config[prop] = config[prop].filter(item => item.id.startsWith('io.paotuan.embed') || existIds[prop].has(item.id))
  })
  ;(['onReceiveCommand', 'beforeParseDiceRoll', 'onCardEntryChange', 'onMessageReaction', 'beforeDiceRoll', 'afterDiceRoll'] as const).forEach(prop => {
    config.hookIds[prop] = config.hookIds[prop].filter(item => existIds.hookIds[prop].has(item.id))
  })

  return config
}

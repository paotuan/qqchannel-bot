import { beforeEach, describe, expect, test } from 'vitest'
import { syncedStore } from '@syncedstore/core'
import { upgradeConfig } from '../config/migration/upgrade'
import configV1 from './config/v1.json'
import configV42 from './config/v42.json'
import configV42withPlugin from './config/v42-with-plugin.json'
import { registerPlugins } from './plugin.test'
import { updateConfigByPlugin } from '../config/migration/updateByPlugin'

function createProxiedConfig(configData: any) {
  const store = syncedStore<{ config: Record<string, any> }>({ config: {} })
  store.config.default = configData
  return store.config.default
}

describe('config upgrade', () => {

  beforeEach(() => {
    // 模拟真实用户的默认插件配置
    registerPlugins([
      'io.paotuan.plugin.cardgen',
      'io.paotuan.plugin.compatible',
      'io.paotuan.plugin.draw',
      'io.paotuan.plugin.insane',
      'io.paotuan.plugin.namegen',
    ])
  })

  test('config upgrade', () => {
    const oldData = createProxiedConfig(configV1)
    const newData = updateConfigByPlugin(upgradeConfig(oldData))
    expect(JSON.stringify(newData)).toStrictEqual(JSON.stringify(configV42))
  })

  test('add plugin update config', () => {
    const config = createProxiedConfig(configV42)
    registerPlugins(['io.paotuan.plugin.coc.realrbrp', 'io.paotuan.plugin.globalflags'])
    const config1 = updateConfigByPlugin(config)
    expect(JSON.stringify(config1)).toStrictEqual(JSON.stringify(configV42withPlugin))
  })

  test('remove plugin update config', () => {
    const config = createProxiedConfig(configV42withPlugin)
    const config1 = updateConfigByPlugin(config)
    expect(JSON.stringify(config1)).toStrictEqual(JSON.stringify(configV42))
  })
})

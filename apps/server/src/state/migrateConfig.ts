import { ChannelUnionId } from '../adapter/utils'
import { IChannelConfig } from '@paotuan/config'
import { ConfigProvider } from '@paotuan/dicecore'
import { cloneDeep, isEmpty } from 'lodash'
import { resolveRootDir } from '../utils'
import fs from 'fs'

type IChannelConfigWrapper = { current: IChannelConfig }

const CONFIG_DIR = resolveRootDir('config')

export function migrateConfig(configRef: IChannelConfigWrapper, channelUnionId: ChannelUnionId | 'default') {
  if (!fs.existsSync(CONFIG_DIR)) return
  const configPath = `${CONFIG_DIR}/${channelUnionId}.json`
  const configPathV1 = (() => {
    if (channelUnionId.startsWith('qqguild_')) {
      const channelId = channelUnionId.split('_').at(-1)
      if (channelId) {
        return `${CONFIG_DIR}/${channelId}.json`
      }
    }
    return undefined
  })()
  const configExist = fs.existsSync(configPath)
  const configV1Exist = !!configPathV1 && fs.existsSync(configPathV1)
  const realConfigPath = configExist ? configPath : configV1Exist ? configPathV1 : undefined
  if (realConfigPath) {
    console.log('[Config] 迁移旧版配置数据')
    try {
      const str = fs.readFileSync(realConfigPath, 'utf8')
      const config = JSON.parse(str) as IChannelConfig
      // 转为响应式
      configRef.current = config
      // 注册应该 registerAndUpgradeConfig 会处理，此处无需处理
    } catch (e) {
      console.error(`[Config] ${realConfigPath} 解析失败`, e)
    }
  }
  // 迁移完毕删除数据
  if (configExist) {
    try {
      fs.unlinkSync(configPath)
    } catch (e) {
      // ignore
    }
  }
  if (configV1Exist) {
    try {
      fs.unlinkSync(configPathV1)
    } catch (e) {
      // ignore
    }
  }
}

// config 每次 load 出来的时候就去进行注册。注册时内部会处理升级逻辑
export function registerAndUpgradeConfig(configRef: IChannelConfigWrapper, channelUnionId: ChannelUnionId | 'default') {
  // 如果没有 default config，无需处理，使用 dicecore 内部的 default config
  if (channelUnionId === 'default' && isEmpty(configRef.current)) {
    return
  }
  // 我们确保每个 channel 都生成一份配置，以便同步
  if (isEmpty(configRef.current)) {
    configRef.current = cloneDeep(ConfigProvider.defaultConfig.config)
  }
  ConfigProvider.register(channelUnionId, configRef.current)
}

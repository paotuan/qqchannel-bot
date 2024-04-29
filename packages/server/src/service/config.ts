import fs from 'fs'
import { globSync } from 'fast-glob'
import { makeAutoObservable } from 'mobx'
import type { Wss } from '../app/wss'
import type { IChannelConfig } from '@paotuan/config'
import type { IChannelConfigReq } from '@paotuan/types'
import type { WsClient } from '../app/wsclient'
import { asChannelUnionId, ChannelUnionId } from '../adapter/utils'
import { resolveRootDir } from '../utils'
import { ConfigProvider } from '@paotuan/dicecore'
import { cloneDeep } from 'lodash'

const CONFIG_DIR = resolveRootDir('config')

export class ConfigManager {
  private readonly wss: Wss
  private readonly configMap: Record<ChannelUnionId, IChannelConfig> = {}
  private defaultConfig!: IChannelConfig
  // 保存旧版本数据用于兼容 channelId(qqguild) => config
  private readonly configMapV1: Record<string, IChannelConfig> = {}

  constructor(wss: Wss) {
    makeAutoObservable(this)
    this.wss = wss
    this.initConfig()
  }

  // 暂用于响应式地通知前端 config 有更新
  getChannelConfig_Plain_Observable(channelUnionId: ChannelUnionId) {
    return this.configMap[channelUnionId] || this.defaultConfig
  }

  getChannelConfig(channelUnionId: ChannelUnionId | 'default') {
    if (channelUnionId === 'default') {
      return ConfigProvider.defaultConfig
    } else if (this.configMap[channelUnionId]) {
      return ConfigProvider.getConfig(channelUnionId)
    } else if (channelUnionId.startsWith('qqguild_')) {
      // 如有旧版本配置，迁移到新版
      const channelId = channelUnionId.split('_').at(-1)!
      if (this.configMapV1[channelId]) {
        console.log('[Config] 迁移旧版本配置：', channelUnionId)
        const config = this.configMapV1[channelId]
        delete this.configMapV1[channelId]
        deleteConfigFile(channelId)
        this.saveChannelConfig(channelUnionId, { config, setDefault: false })
        return ConfigProvider.getConfig(channelUnionId)
      }
    }
    return ConfigProvider.defaultConfig
  }

  saveChannelConfig(channelUnionId: ChannelUnionId, { config, setDefault }: IChannelConfigReq) {
    console.log('[Config] 保存配置，设为默认配置：', setDefault)
    this.configMap[channelUnionId] = cloneDeep(config)
    // 传入响应式对象，确保内部变化被监听到
    ConfigProvider.register(channelUnionId, this.configMap[channelUnionId])
    saveConfigFile(channelUnionId, config)
    if (setDefault) {
      this.defaultConfig = cloneDeep(config)
      ConfigProvider.register('default', this.defaultConfig)
      saveConfigFile('default', config)
    }
  }

  resetChannelConfig(client: WsClient) {
    console.log('[Config] 重置为默认配置')
    const channelUnionId = client.listenToChannelUnionId
    if (!channelUnionId) return
    delete this.configMap[channelUnionId]
    deleteConfigFile(channelUnionId)
  }

  private initConfig() {
    try {
      console.log('[Config] 开始读取配置')
      if (fs.existsSync(CONFIG_DIR)) {
        const files: string[] = globSync(`${CONFIG_DIR}/*.json`)
        files.forEach(filename => {
          try {
            const str = fs.readFileSync(filename, 'utf8')
            const config = JSON.parse(str) as IChannelConfig
            const name = filename.match(/config\/(.+)\.json$/)![1]
            if (name === 'default') {
              this.defaultConfig = config
              ConfigProvider.register('default', this.defaultConfig)
            } else {
              const unionId = asChannelUnionId(name)
              if (unionId) {
                this.configMap[unionId] = config
                ConfigProvider.register(unionId, this.configMap[unionId])
              } else {
                this.configMapV1[name] = config
              }
            }
          } catch (e) {
            console.log(`[Config] ${filename} 解析失败`, e)
          }
        })
      }
    } catch (e) {
      console.error('[Config] 读取配置列表失败', e)
    }
    // 初始化默认配置，也设为响应式
    if (!this.defaultConfig) {
      this.defaultConfig = ConfigProvider.defaultConfig.config
      ConfigProvider.register('default', this.defaultConfig)
    }
  }
}

function saveConfigFile(name: string, config: IChannelConfig) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR)
  }
  fs.writeFile(`${CONFIG_DIR}/${name}.json`, JSON.stringify(config), (e) => {
    if (e) {
      console.error('[Config] 配置写文件失败', e)
    }
  })
}

function deleteConfigFile(name: string) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      return
    }
    const filePath = `${CONFIG_DIR}/${name}.json`
    if (!fs.existsSync(filePath)) {
      return // 可能本来就是用的默认配置，无需处理
    }
    fs.unlinkSync(filePath)
  } catch (e) {
    console.error('[Config] 删除配置失败', e)
  }
}

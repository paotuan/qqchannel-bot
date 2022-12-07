import * as fs from 'fs'
import * as glob from 'glob'
import { makeAutoObservable } from 'mobx'
import type { Wss } from '../../app/wss'
import type { IChannelConfig } from '../../../interface/config'
import type { IChannelConfigReq } from '../../../interface/common'
import type { WsClient } from '../../app/wsclient'
import { getInitialDefaultConfig, handleUpgrade } from './default'
import { ChannelConfig } from './config'
import type { PluginManager } from './plugin'

const CONFIG_DIR = './config'

export class ConfigManager {
  private readonly wss: Wss
  private readonly plugin: PluginManager
  private readonly configMap: Record<string, ChannelConfig> = {}

  constructor(wss: Wss, plugin: PluginManager) {
    makeAutoObservable<this, 'wss' | 'plugin'>(this, { wss: false, plugin: false })
    this.wss = wss
    this.plugin = plugin
    this.initConfig()
  }

  get defaultConfig() {
    return this.configMap['default']
  }

  getChannelConfig(channelId: string | 'default') {
    return this.configMap[channelId] || this.defaultConfig
  }

  saveChannelConfig(client: WsClient, { config, setDefault }: IChannelConfigReq) {
    console.log('[Config] 保存配置，设为默认配置：', setDefault)
    const channelId = client.listenToChannelId
    this.configMap[channelId] = new ChannelConfig(config, this.plugin)
    this.saveToFile(channelId, config)
    if (setDefault) {
      this.configMap['default'] = new ChannelConfig(config, this.plugin)
      this.saveToFile('default', config)
    }
  }

  resetChannelConfig(client: WsClient) {
    console.log('[Config] 重置为默认配置')
    const channelId = client.listenToChannelId
    // 重置配置时，显式为这个子频道创建一个新的配置对象。确保依赖发生变化，autorun 推送配置到前端
    // 否则只在前端编辑，未保存时，点击重置配置，后端无法感知到频道的默认配置发生了变化
    this.configMap[channelId] = new ChannelConfig(this.defaultConfig.config, this.plugin)
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        return
      }
      const filePath = `${CONFIG_DIR}/${channelId}.json`
      if (!fs.existsSync(filePath)) {
        return // 可能本来就是用的默认配置，无需处理
      }
      fs.unlinkSync(filePath)
    } catch (e) {
      console.error('[Config] 删除配置失败', e)
    }
  }

  private initConfig() {
    try {
      console.log('[Config] 开始读取配置')
      if (fs.existsSync(CONFIG_DIR)) {
        const files: string[] = glob.sync(`${CONFIG_DIR}/*.json`)
        files.forEach(filename => {
          try {
            const str = fs.readFileSync(filename, 'utf8')
            const config = JSON.parse(str) as IChannelConfig
            const name = filename.match(/config\/(.+)\.json$/)![1]
            this.configMap[name] = new ChannelConfig(handleUpgrade(config), this.plugin)
          } catch (e) {
            console.log(`[Config] ${filename} 解析失败`, e)
          }
        })
      }
    } catch (e) {
      console.error('[Config] 读取配置列表失败', e)
    }
    // 判断是否有默认配置
    if (!this.configMap['default']) {
      this.configMap['default'] = new ChannelConfig(getInitialDefaultConfig(), this.plugin)
    }
  }

  private saveToFile(channelIdOrDefault: string, config: IChannelConfig) {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR)
    }
    fs.writeFile(`${CONFIG_DIR}/${channelIdOrDefault}.json`, JSON.stringify(config), (e) => {
      if (e) {
        console.error('[Config] 配置写文件失败', e)
      }
    })
  }
}

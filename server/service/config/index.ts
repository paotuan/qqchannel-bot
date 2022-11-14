import * as fs from 'fs'
import * as glob from 'glob'
import type { Wss } from '../../app/wss'
import { makeAutoObservable } from 'mobx'
import type { IChannelConfig, IPluginConfig } from '../../../interface/config'
import type { IChannelConfigReq, IChannelConfigResetReq } from '../../../interface/common'

const CONFIG_DIR = './config'
const PLUGIN_DIR = './plugins'

export class ConfigManager {
  private readonly wss: Wss
  private readonly configMap: Record<string, IChannelConfig> = {}
  private readonly pluginMap: Record<string, IPluginConfig> = {} // 后续看要不要放到单独的类里

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    this.initConfig()
  }

  get defaultConfig() {
    return this.configMap['default']
  }

  getChannelConfig(channelId: string) {
    return this.configMap[channelId] || this.defaultConfig
  }

  saveChannelConfig({ channelId, config, setDefault }: IChannelConfigReq) {
    console.log('[Config] 保存配置，设为默认配置：', setDefault)
    this.configMap[channelId] = config
    this.saveToFile(channelId, config)
    if (setDefault) {
      this.configMap['default'] = config
      this.saveToFile('default', config)
    }
  }

  resetChannelConfig({ channelId }: IChannelConfigResetReq) {
    console.log('[Config] 删除配置')
    delete this.configMap[channelId]
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        return
      }
      fs.unlinkSync(`${CONFIG_DIR}/${channelId}.json`)
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
            const name = filename.match(/\/(.+)\.json$/)![1]
            this.configMap[name] = config // handleUpgrade, 如果是增加了新的配置可以加上
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
      this.configMap['default'] = getInitialDefaultConfig()
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

function getInitialDefaultConfig(): IChannelConfig {
  return {
    version: 1,
    defaultRoll: 'd100',
    customReplyIds: [
      {
        id: 'io.paotuan.embed.jrrp',
        enabled: true
      }
    ],
    embedPlugin: {
      id: 'io.paotuan.embed',
      customReply: [
        {
          id: 'jrrp',
          name: '今日运势',
          command: 'jrrp',
          trigger: 'exact',
          items: [
            {
              weight: 1,
              reply: '{{at}}今天的幸运指数是 [[d100]] !'
            }
          ]
        }
      ]
    },
    lastModified: 0
  }
}

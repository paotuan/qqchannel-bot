import * as fs from 'fs'
import * as glob from 'glob'
import type { Wss } from '../../app/wss'
import { makeAutoObservable } from 'mobx'
import type { IChannelConfig, IPluginConfig } from '../../../interface/config'

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

  private initConfig() {
    try {
      if (!fs.existsSync(CONFIG_DIR)) return
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
    } catch (e) {
      console.error('[Config] 读取配置列表失败', e)
    }
    // 判断是否有默认配置
    if (!this.configMap['default']) {
      this.configMap['default'] = getInitialDefaultConfig()
    }
  }
}

function getInitialDefaultConfig(): IChannelConfig {
  return {
    version: 1,
    defaultRoll: 'd100',
    customReplyIds: [],
    embedPlugin: {
      id: 'io.paotuan.embed.default',
      customReply: [
        {
          id: 'jrrp',
          name: '今日运势',
          command: 'jrrp',
          trigger: 'exact',
          items: [
            {
              weight: 1,
              reply: '{{at}} 今天的运势是 [[d100]] !'
            }
          ]
        }
      ]
    },
    lastModified: 0
  }
}

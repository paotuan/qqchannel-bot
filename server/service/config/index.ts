import * as fs from 'fs'
import * as glob from 'glob'
import { cloneDeep } from 'lodash'
import { makeAutoObservable } from 'mobx'
import type { Wss } from '../../app/wss'
import type { IChannelConfig, IPluginConfig } from '../../../interface/config'
import type { IChannelConfigReq } from '../../../interface/common'
import type { WsClient } from '../../app/wsclient'

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

  saveChannelConfig(client: WsClient, { config, setDefault }: IChannelConfigReq) {
    console.log('[Config] 保存配置，设为默认配置：', setDefault)
    const channelId = client.listenToChannelId
    this.configMap[channelId] = config
    this.saveToFile(channelId, config)
    if (setDefault) {
      this.configMap['default'] = config
      this.saveToFile('default', config)
    }
  }

  resetChannelConfig(client: WsClient) {
    console.log('[Config] 重置为默认配置')
    const channelId = client.listenToChannelId
    // 重置配置时，显式 clone 一个新的对象放到内存中。确保依赖发生变化，autorun 推送配置到前端
    // 否则只在前端编辑，未保存时，点击重置配置，后端无法感知到频道的默认配置发生了变化
    this.configMap[channelId] = cloneDeep(this.defaultConfig)
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
      },
      {
        id: 'io.paotuan.embed.coccardrand',
        enabled: true
      },
      {
        id: 'io.paotuan.embed.gacha',
        enabled: true
      },
      {
        id: 'io.paotuan.embed.fudu',
        enabled: true
      }
    ],
    embedPlugin: {
      id: 'io.paotuan.embed',
      customReply: [
        {
          id: 'jrrp',
          name: '今日运势',
          description: '使用 /jrrp 查询今日运势',
          command: 'jrrp',
          trigger: 'exact',
          items: [
            {
              weight: 1,
              reply: '{{at}}今天的幸运指数是 [[d100]] !'
            }
          ]
        },
        {
          id: 'coccardrand',
          name: 'COC 人物作成',
          description: '使用 /coc 随机人物作成',
          command: 'coc',
          trigger: 'exact',
          items: [
            {
              weight: 1,
              reply: '{{at}}人物作成：\n力量[[3d6*5]] 体质[[3d6*5]] 体型[[(2d6+6)*5]] 敏捷[[3d6*5]] 外貌[[3d6*5]] 智力[[(2d6+6)*5]] 意志[[3d6*5]] 教育[[(2d6+6)*5]] 幸运[[3d6*5]]'
            }
          ]
        },
        {
          id: 'gacha',
          name: '简单抽卡',
          description: '使用不同权重进行抽卡的例子',
          command: '抽卡',
          trigger: 'exact',
          items: [
            {
              weight: 2,
              reply: '{{at}}抽到了 ★★★★★★'
            },
            {
              weight: 8,
              reply: '{{at}}抽到了 ★★★★★'
            },
            {
              weight: 48,
              reply: '{{at}}抽到了 ★★★★'
            },
            {
              weight: 42,
              reply: '{{at}}抽到了 ★★★'
            }
          ]
        },
        {
          id: 'fudu',
          name: '复读机',
          description: '使用正则匹配的例子',
          command: '复读\\s*(?<content>.+)',
          trigger: 'regex',
          items: [
            {
              weight: 1,
              reply: '{{content}}'
            }
          ]
        }
      ]
    },
    lastModified: 0
  }
}

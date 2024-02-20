import type { Wss } from '../../app/wss'
import type {
  IPlugin,
  ICustomReplyConfig,
  IPluginRegisterContext,
  IAliasRollConfig, ICustomTextConfig,
  IPluginElementCommonInfo,
  IHookFunction,
  OnReceiveCommandCallback,
  BeforeParseDiceRollCallback, OnCardEntryChangeCallback, OnMessageReactionCallback
} from '../../../interface/config'
import { makeAutoObservable } from 'mobx'
import * as fs from 'fs'
import * as path from 'path'
import _ from 'lodash'
import { VERSION_CODE, VERSION_NAME } from '../../../interface/version'
import { copyFolderSync } from '../../utils'
import type { IPluginConfigDisplay } from '../../../interface/common'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { ICard } from '../../../interface/card/types'
import { render } from 'mustache'
import { parseTemplate } from '../dice/utils'
import { DiceRollContext } from '../DiceRollContext'

const INTERNAL_PLUGIN_DIR = path.resolve('./server/plugins')
const PLUGIN_DIR = './plugins'

export class PluginManager {
  private readonly wss: Wss
  private readonly pluginMap: Record<string, IPlugin> = {}

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    const pluginNames = this.extractOfficialPluginsIfNeed()
    this.loadPlugins(pluginNames)
    this.checkOfficialPluginsUpdate()
  }

  private getPluginRegisterContext(pluginId: string): IPluginRegisterContext {
    const wss = this.wss
    return {
      versionName: VERSION_NAME,
      versionCode: VERSION_CODE,
      roll: exp => new DiceRoll(exp),
      render: (arg1, arg2, arg3) => render(arg1, arg2, arg3, { escape: value => value }),
      getCard: ({ channelId, userId }) => this.wss.cards.getCard(channelId, userId),
      saveCard: (card: ICard) => this.wss.cards.saveCard(card),
      getLinkedCardUserList: ({ channelId }) => Object.keys(this.wss.cards.getLinkMap(channelId)),
      linkCard: ({ channelId, userId }, cardName) => {
        if (userId && !cardName) {
          // 1. 如果传了 userId，没传 cardName，代表解除该 user 的卡关联
          const cardName = this.wss.cards.getCard(channelId, userId)?.name
          if (cardName) {
            this.wss.cards.linkCard(channelId, cardName, userId)
          }
        } else if (cardName && !userId) {
          // 2. 如果传了 cardName，没传 userId，代表解除该卡的 user 关联
          this.wss.cards.linkCard(channelId, cardName, userId)
        } else if (!cardName) {
          // 3. userId 和 cardName 都不传，报错？
          throw new Error('必须传入 userId 或 cardName')
        } else {
          // 4. 正常关联人物卡
          this.wss.cards.linkCard(channelId, cardName, userId)
        }
      },
      queryCard: (query) => this.wss.cards.queryCard(query),
      sendMessageToChannel: ({ channelId, guildId, botId, userId, nick: username, userRole }, msg, options = {}) => {
        const channel = this.wss.qApis.find(botId)?.guilds.findChannel(channelId, guildId)
        if (!channel) throw new Error(`找不到频道，botId=${botId}, guildId=${guildId}, channelId=${channelId}`)
        // 兼容旧接口
        if (typeof options === 'string') {
          options = { msgType: options }
        }
        const { msgType = 'text', skipParse = false } = options
        // 走一套 parseTemplate, 和自定义回复直接 return 的逻辑一致
        if (msgType === 'text') {
          const content = skipParse ? msg : parseTemplate(msg, new DiceRollContext(this.wss, { channelId, userId, username, userRole }), [])
          return channel.sendMessage({ content })
        } else {
          return channel.sendMessage({ image: msg })
        }
      },
      sendMessageToUser: ({ channelId, guildId, botId, userId, nick: username, userRole }, msg, options = {}) => {
        const user = this.wss.qApis.find(botId)?.guilds.findUser(userId, guildId)
        if (!user) throw new Error(`找不到用户，botId=${botId}, guildId=${guildId}, userId=${userId}`)
        // 兼容旧接口
        if (typeof options === 'string') {
          options = { msgType: options }
        }
        const { msgType = 'text', skipParse = false } = options
        // 走一套 parseTemplate, 和自定义回复直接 return 的逻辑一致
        if (msgType === 'text') {
          const content = skipParse ? msg : parseTemplate(msg, new DiceRollContext(this.wss, { channelId, userId, username, userRole }), [])
          return user.sendMessage({ content })
        } else {
          return user.sendMessage({ image: msg })
        }
      },
      getConfig: ({ channelId }) => wss.config.getChannelConfig(channelId).config,
      getPreference: ({ channelId }) => {
        const channelConfig = wss.config.getChannelConfig(channelId)
        const pluginConfig = channelConfig.config.plugins.find(plugin => plugin.id === pluginId)
        return pluginConfig?.preference ?? {}
      },
      dispatchUserCommand: (parsed) => this.wss.qApis.find(parsed.context.botId)?.dispatchCommand(parsed),
      _context: wss,
      _ // provide lodash for convenience
    } // todo: getItem/setItem
  }

  // 自带插件释放到 plugins 文件夹下
  // 如果 plugins 下没有该 plugin 的文件夹，则复制过去
  private extractOfficialPluginsIfNeed() {
    console.log('[Plugin] 开始加载插件')
    if (!fs.existsSync(PLUGIN_DIR)) {
      fs.mkdirSync(PLUGIN_DIR)
    }
    // 读取当前已有插件列表
    const pluginNames = new Set(fs
      .readdirSync(PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name))
    // 内置插件列表
    // 此处 ncc 打包时会智能地打到 dist/server/plugins 下，pkg 打包时通过 assets 配置保留文件，因此路径比较 tricky 地保持了一致
    const internalPluginNames = fs
      .readdirSync(INTERNAL_PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    // 如有新的内置插件不在已有插件列表，则复制过去
    // 不每次复制是为了可以保留用户对已有插件的魔改。但 development 时每次都复制以提升开发体验
    internalPluginNames.forEach(pluginName => {
      if (!pluginNames.has(pluginName) || process.env.NODE_ENV === 'development') {
        copyFolderSync(path.join(INTERNAL_PLUGIN_DIR, pluginName), path.join(PLUGIN_DIR, pluginName))
        pluginNames.add(pluginName) // 记录到插件列表里去
      }
    })
    return Array.from(pluginNames)
  }

  private loadPlugins(pluginNames: string[]) {
    pluginNames.forEach(pluginName => {
      this.loadPlugin(pluginName)
    })
  }

  private loadPlugin(pluginName: string) {
    try {
      // require.cache 的 key 是带 index.js 的，因此组装路径时也要带上
      const fullPath = path.join(process.cwd(), PLUGIN_DIR, pluginName, 'index.js')
      // 注意不能完全避免问题，仍然有副作用重复执行或内存泄露的风险
      delete require.cache[fullPath]
      const context = this.getPluginRegisterContext(pluginName) // 此处依赖 plugin.id 与文件夹名称需保持一致
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const plugin = require(fullPath)(context) as IPlugin // 未来可以通过 require(fullPath).id 等方式解除文件夹名称的限制
      plugin.id ||= pluginName
      handlePluginCompatibility(plugin)
      console.log('[Plugin] 加载插件', plugin.id)
      this.pluginMap[plugin.id] = plugin
    } catch (e) {
      console.error(`[Plugin] 加载插件 ${pluginName} 出错：`, e)
    }
  }

  // 如果版本号有更新，则删除旧文件，加载新的文件
  private checkOfficialPluginsUpdate() {
    Object.entries(officialPluginsVersions).forEach(([name, version]) => {
      const currentVersion = this.pluginMap[name]?.version
      if (!currentVersion) return
      if (version > currentVersion) {
        console.log(`[Plugin] 检测到插件 ${name} 有更新，即将进行更新。若更新后功能异常，请尝试重新启动软件。`)
        // 考虑到牌堆插件的更新，不删除文件了，反正一般也没必要删除，都是覆盖
        // fs.rmdirSync(path.join(PLUGIN_DIR, name), { recursive: true })
        copyFolderSync(path.join(INTERNAL_PLUGIN_DIR, name), path.join(PLUGIN_DIR, name))
        // 再次加载插件
        this.loadPlugin(name)
      }
    })
  }

  // 手动重载插件
  public manualReloadPlugins(pluginNames: string[]) {
    if (pluginNames.length > 0) {
      // 如果是 develop mode，需要先复制一遍
      if (process.env.NODE_ENV === 'development') {
        pluginNames.forEach(name => {
          copyFolderSync(path.join(INTERNAL_PLUGIN_DIR, name), path.join(PLUGIN_DIR, name))
        })
      }
      // 重载指定的插件
      this.loadPlugins(pluginNames)
    } else {
      // 读取并载入所有的插件
      const pluginNames = this.extractOfficialPluginsIfNeed()
      this.loadPlugins(pluginNames)
    }
  }

  // 获取插件内容清单（不含插件具体逻辑，用于展示和更新 config）
  get pluginListManifest(): IPluginConfigDisplay[] {
    return Object.values(this.pluginMap).map<IPluginConfigDisplay>(plugin => ({
      id: plugin.id,
      name: plugin.name || plugin.id || '--',
      description: plugin.description ?? '',
      preference: (plugin.preference ?? []).map(pref => ({
        key: pref.key,
        label: pref.label ?? pref.key,
        defaultValue: pref.defaultValue ?? ''
      })),
      customReply: (plugin.customReply || []).map(withDefaults),
      // rollDecider: (plugin.rollDecider || []).map(withDefaults),
      rollDecider: [],
      aliasRoll: (plugin.aliasRoll || []).map(withDefaults),
      customText: (plugin.customText || []).map(withDefaults),
      hook: {
        onReceiveCommand: (plugin.hook?.onReceiveCommand || []).map(withDefaults),
        beforeParseDiceRoll: (plugin.hook?.beforeParseDiceRoll || []).map(withDefaults),
        onCardEntryChange: (plugin.hook?.onCardEntryChange || []).map(withDefaults),
        onMessageReaction: (plugin.hook?.onMessageReaction || []).map(withDefaults),
      }
    }))
  }

  // 提供 custom reply 的列表: fullId => config
  get pluginCustomReplyMap(): Record<string, ICustomReplyConfig> {
    const ret: Record<string, ICustomReplyConfig> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.customReply) return
      plugin.customReply.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 roll decider 的列表：fullId => config
  // get pluginRollDeciderMap(): Record<string, IRollDeciderConfig> {
  //   const ret: Record<string, IRollDeciderConfig> = {}
  //   Object.values(this.pluginMap).forEach(plugin => {
  //     if (!plugin.rollDecider) return
  //     plugin.rollDecider.forEach(item => {
  //       ret[`${plugin.id}.${item.id}`] = item
  //     })
  //   })
  //   return ret
  // }

  // 提供 alias roll 的列表：fullId => config
  get pluginAliasRollMap(): Record<string, IAliasRollConfig> {
    const ret: Record<string, IAliasRollConfig> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.aliasRoll) return
      plugin.aliasRoll.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 custom text 的列表：fullId => config
  get pluginCustomTextMap(): Record<string, ICustomTextConfig> {
    const ret: Record<string, ICustomTextConfig> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.customText) return
      plugin.customText.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 hook: onReceiveCommand
  // fullId => IHookFunction<OnReceiveCommandCallback>
  get hookOnReceiveCommandMap(): Record<string, IHookFunction<OnReceiveCommandCallback>> {
    const ret: Record<string, IHookFunction<OnReceiveCommandCallback>> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.hook?.onReceiveCommand) return
      plugin.hook.onReceiveCommand.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 hook: beforeParseDiceRoll
  // fullId => IHookFunction<BeforeParseDiceRollCallback>
  get hookBeforeParseDiceRollMap(): Record<string, IHookFunction<BeforeParseDiceRollCallback>> {
    const ret: Record<string, IHookFunction<BeforeParseDiceRollCallback>> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.hook?.beforeParseDiceRoll) return
      plugin.hook.beforeParseDiceRoll.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 hook: onCardEntryChange
  // fullId => IHookFunction<OnCardEntryChangeCallback>
  get hookOnCardEntryChangeMap(): Record<string, IHookFunction<OnCardEntryChangeCallback>> {
    const ret: Record<string, IHookFunction<OnCardEntryChangeCallback>> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.hook?.onCardEntryChange) return
      plugin.hook.onCardEntryChange.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 hook: onMessageReaction
  // fullId => IHookFunction<OnMessageReactionCallback>
  get hookOnMessageReactionMap(): Record<string, IHookFunction<OnMessageReactionCallback>> {
    const ret: Record<string, IHookFunction<OnMessageReactionCallback>> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.hook?.onMessageReaction) return
      plugin.hook.onMessageReaction.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }
}

// plugin 兼容性处理
function handlePluginCompatibility(plugin: IPlugin) {
  // alias roll scope 默认值为 expression
  plugin.aliasRoll?.forEach(r => {
    r.scope ||= 'expression'
  })
}

// IPluginElementCommonInfo 附加默认信息，供展示和索引使用
function withDefaults(pluginItem: IPluginElementCommonInfo) {
  return {
    id: pluginItem.id,
    name: pluginItem.name,
    description: pluginItem.description ?? '',
    defaultEnabled: pluginItem.defaultEnabled ?? true
  }
}

const officialPluginsVersions = {
  'io.paotuan.plugin.namegen': 2,
  'io.paotuan.plugin.insane': 3,
  'io.paotuan.plugin.cardgen': 4,
  'io.paotuan.plugin.draw': 2,
  // 'io.paotuan.plugin.cocrules': 1,
  // 'io.paotuan.plugin.globalflags': 1
  'io.paotuan.plugin.compatible': 1
}

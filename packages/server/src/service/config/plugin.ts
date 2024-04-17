import type { Wss } from '../../app/wss'
import type {
  IPlugin,
  ICustomReplyConfig,
  IAliasRollConfig,
  ICustomTextConfig,
  IPluginElementCommonInfo,
  IHookFunction,
  OnReceiveCommandCallback,
  BeforeParseDiceRollCallback,
  OnCardEntryChangeCallback,
  OnMessageReactionCallback,
  BeforeDiceRollCallback,
  AfterDiceRollCallback
} from '@paotuan/config'
import { VERSION_CODE, VERSION_NAME, type IPluginRegisterContext, type IPluginConfigDisplay } from '@paotuan/types'
import { makeAutoObservable } from 'mobx'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import { copyFolderSync } from '../../utils'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import type { ICard } from '@paotuan/card'
import Mustache from 'mustache'
import { parseTemplate } from '../dice/utils'
import { DiceRollContext } from '../DiceRollContext'
import { getChannelUnionId } from '../../adapter/utils'

const INTERNAL_PLUGIN_DIR = process.env.NODE_ENV === 'development' ? path.resolve('./src/plugins') : path.resolve(__dirname, './plugins')
const PLUGIN_DIR = './plugins' // prod 环境外部插件文件夹

export class PluginManager {
  private readonly wss: Wss
  private readonly pluginMap: Record<string, IPlugin> = {}

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    const pluginNames = this.extractOfficialPluginsIfNeed()
    this.loadPlugins(pluginNames)
    // dev 环境从单一来源加载插件，不存在插件更新的问题
    if (process.env.NODE_ENV !== 'development') {
      this.checkOfficialPluginsUpdate()
    }
  }

  private getPluginRegisterContext(pluginId: string): IPluginRegisterContext {
    const wss = this.wss
    return {
      versionName: VERSION_NAME,
      versionCode: VERSION_CODE,
      roll: exp => new DiceRoll(exp),
      render: (arg1, arg2, arg3) => Mustache.render(arg1, arg2, arg3, { escape: value => value }),
      getCard: ({ platform, guildId, channelId, userId }) => {
        const channelUnionId = getChannelUnionId(platform, guildId, channelId)
        return this.wss.cards.getCard(channelUnionId, userId)
      },
      saveCard: (card: ICard) => this.wss.cards.saveCard(card),
      getLinkedCardUserList: ({ platform, guildId, channelId }) => {
        const channelUnionId = getChannelUnionId(platform, guildId, channelId)
        return Object.keys(this.wss.cards.getLinkMap(channelUnionId))
      },
      linkCard: ({ platform, guildId, channelId, userId }, cardName) => {
        const channelUnionId = getChannelUnionId(platform, guildId, channelId)
        if (userId && !cardName) {
          // 1. 如果传了 userId，没传 cardName，代表解除该 user 的卡关联
          const cardName = this.wss.cards.getCard(channelUnionId, userId)?.name
          if (cardName) {
            this.wss.cards.linkCard(channelUnionId, cardName, userId)
          }
        } else if (cardName && !userId) {
          // 2. 如果传了 cardName，没传 userId，代表解除该卡的 user 关联
          this.wss.cards.linkCard(channelUnionId, cardName, userId)
        } else if (!cardName) {
          // 3. userId 和 cardName 都不传，报错？
          throw new Error('必须传入 userId 或 cardName')
        } else {
          // 4. 正常关联人物卡
          this.wss.cards.linkCard(channelUnionId, cardName, userId)
        }
      },
      queryCard: (query) => this.wss.cards.queryCard(query),
      sendMessageToChannel: ({ platform, channelId, guildId, botId, userId, username, userRole }, msg, options = {}) => {
        const bot = this.wss.bots.find(botId)
        const channel = bot?.guilds.findChannel(channelId, guildId)
        if (!channel || !bot) throw new Error(`找不到频道，botId=${botId}, guildId=${guildId}, channelId=${channelId}`)
        // 兼容旧接口
        if (typeof options === 'string') {
          options = { msgType: options }
        }
        const { msgType = 'text', skipParse = false } = options
        // 走一套 parseTemplate, 和自定义回复直接 return 的逻辑一致
        if (msgType === 'text') {
          const content = skipParse ? msg : parseTemplate(msg, new DiceRollContext(bot, { platform, guildId, channelId, userId, username, userRole }), [], 'message_template')
          return channel.sendMessage(content)
        } else {
          return channel.sendMessage(`<img src="${msg}"/>`)
        }
      },
      sendMessageToUser: ({ platform, channelId, guildId, botId, userId, username, userRole }, msg, options = {}) => {
        const bot = this.wss.bots.find(botId)
        const user = bot?.guilds.findUser(userId, guildId)
        if (!user || !bot) throw new Error(`找不到用户，botId=${botId}, guildId=${guildId}, userId=${userId}`)
        // 兼容旧接口
        if (typeof options === 'string') {
          options = { msgType: options }
        }
        const { msgType = 'text', skipParse = false } = options
        // 走一套 parseTemplate, 和自定义回复直接 return 的逻辑一致
        if (msgType === 'text') {
          const content = skipParse ? msg : parseTemplate(msg, new DiceRollContext(bot, { platform, guildId, channelId, userId, username, userRole }), [], 'message_template')
          return user.sendMessage(content)
        } else {
          return user.sendMessage(`<img src="${msg}"/>`)
        }
      },
      getConfig: ({ platform, guildId, channelId }) => {
        const channelUnionId = getChannelUnionId(platform, guildId, channelId)
        return wss.config.getChannelConfig(channelUnionId).config
      },
      getPreference: ({ platform, guildId, channelId }) => {
        const channelUnionId = getChannelUnionId(platform, guildId, channelId)
        const channelConfig = wss.config.getChannelConfig(channelUnionId)
        const pluginConfig = channelConfig.config.plugins.find(plugin => plugin.id === pluginId)
        return pluginConfig?.preference ?? {}
      },
      dispatchUserCommand: async (parsed) => {
        return this.wss.bots.find(parsed.context.botId)?.dispatchCommand(parsed)
      },
      _context: wss,
      _ // provide lodash for convenience
    } // todo: getItem/setItem
  }

  // 自带插件释放到 plugins 文件夹下
  // 如果 plugins 下没有该 plugin 的文件夹，则复制过去
  private extractOfficialPluginsIfNeed() {
    console.log('[Plugin] 开始加载插件')
    // develop 环境，直接从 internal dir 读取
    if (process.env.NODE_ENV === 'development') {
      const internalPluginNames = fs
        .readdirSync(INTERNAL_PLUGIN_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
      return internalPluginNames
    }

    // prod 环境
    if (!fs.existsSync(PLUGIN_DIR)) {
      fs.mkdirSync(PLUGIN_DIR)
    }
    // 读取当前已有插件列表
    const pluginNames = new Set(fs
      .readdirSync(PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name))
    // 内置插件列表
    const internalPluginNames = fs
      .readdirSync(INTERNAL_PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    // 如有新的内置插件不在已有插件列表，则复制过去
    // 不每次复制是为了可以保留用户对已有插件的魔改
    internalPluginNames.forEach(pluginName => {
      if (!pluginNames.has(pluginName)) {
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
      const fullPath = process.env.NODE_ENV === 'development'
        ? path.join(INTERNAL_PLUGIN_DIR, pluginName, 'index.js')
        : path.join(process.cwd(), PLUGIN_DIR, pluginName, 'index.js')
      // 注意不能完全避免问题，仍然有副作用重复执行或内存泄露的风险
      // 使用 eval 是为了防止 ncc 对 require 的转译，以确保插件是从真实的外部路径进行加载的
      eval('delete require.cache[fullPath]')
      const context = this.getPluginRegisterContext(pluginName) // 此处依赖 plugin.id 与文件夹名称需保持一致
      const plugin = eval('require(fullPath)(context)') as IPlugin // 未来可以通过 require(fullPath).id 等方式解除文件夹名称的限制
      plugin.id ||= pluginName
      handlePluginCompatibility(plugin)
      console.log('[Plugin] 加载插件', plugin.id)
      this.pluginMap[plugin.id] = plugin
      // todo register plugins
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
        beforeDiceRoll: (plugin.hook?.beforeDiceRoll || []).map(withDefaults),
        afterDiceRoll: (plugin.hook?.afterDiceRoll || []).map(withDefaults),
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

  // 提供 hook: beforeDiceRoll
  // fullId => IHookFunction<BeforeDiceRollCallback>
  get hookBeforeDiceRollMap(): Record<string, IHookFunction<BeforeDiceRollCallback>> {
    const ret: Record<string, IHookFunction<BeforeDiceRollCallback>> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.hook?.beforeDiceRoll) return
      plugin.hook.beforeDiceRoll.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

  // 提供 hook: afterDiceRoll
  // fullId => IHookFunction<AfterDiceRollCallback>
  get hookAfterDiceRollMap(): Record<string, IHookFunction<AfterDiceRollCallback>> {
    const ret: Record<string, IHookFunction<AfterDiceRollCallback>> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.hook?.afterDiceRoll) return
      plugin.hook.afterDiceRoll.forEach(item => {
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

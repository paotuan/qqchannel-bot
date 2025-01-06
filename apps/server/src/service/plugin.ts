import type { Wss } from '../app/wss'
import type { BotContext, ICommand, IPlugin, IPluginElementCommonInfo } from '@paotuan/config'
import {
  VERSION_CODE,
  VERSION_NAME,
  type IPluginRegisterContext,
  type IPluginConfigDisplay,
  type SendMessageOptions
} from '@paotuan/types'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import { copyFolderSync } from '../utils'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import Mustache from 'mustache'
import { getChannelUnionId } from '../adapter/utils'
import { parseTemplate, PluginProvider } from '@paotuan/dicecore'
import { Element } from '@satorijs/core'

export const INTERNAL_PLUGIN_DIR = process.env.NODE_ENV === 'development' ? path.resolve('./src/plugins') : path.resolve(__dirname, './plugins')
export const PLUGIN_DIR = './plugins' // prod 环境外部插件文件夹

export class PluginManager {
  private readonly wss: Wss

  constructor(wss: Wss) {
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
      getCard: ({ channelUnionId, userId }) => this.wss.cards.getCard(channelUnionId, userId),
      saveCard: () => void 0,
      getLinkedCardUserList: ({ channelUnionId }) => Object.keys(this.wss.cards.getLinkMap(channelUnionId)),
      linkCard: ({ channelUnionId, userId }, cardName) => {
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
      sendMessageToChannel: (env, msg, options = {}) => {
        // 兼容旧接口
        if (typeof options === 'string') options = { msgType: options }
        return this._pluginSendMessage(env, msg, options, pluginId)
      },
      sendMessageToUser: (env, msg, options = {}) => {
        // 兼容旧接口
        if (typeof options === 'string') options = { msgType: options }
        return this._pluginSendMessage(env, msg, options, pluginId, env.userId)
      },
      sendMessage: (env, msg, options = {}) => {
        return this._pluginSendMessage(env, msg, options, pluginId)
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
        return this.wss.bots.find(parsed.context.botId)?.commandHandler.handleCommand(parsed)
      },
      _context: wss,
      _, // provide lodash for convenience
      h: Element // provide Element for convenience
    } // todo: getItem/setItem
  }

  private async _pluginSendMessage(env: ICommand<BotContext>['context'], msg: string, options: SendMessageOptions = {}, pluginId: string, forceUserId?: string) {
    const bot = this.wss.bots.find(env.botId)
    if (!bot) return
    const command: ICommand<BotContext> = { command: '', context: env }
    const { msgType = 'text', skipParse = false } = options
    if (msgType === 'text') {
      // 走一套 parseTemplate, 和自定义回复直接 return 的逻辑一致
      let content = skipParse ? msg : parseTemplate(msg, env, [], 'message_template')
      // 如包含本地图片，需要把本地图片 baseUrl 修改为插件的路径
      content = Element.transform(content, ({ type, attrs }) => {
        if (type === 'img') {
          const url: string = attrs.src || ''
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            attrs.src = `__plugins__/${pluginId}/${url}`
          }
        }
        return true
      })
      return bot.commandHandler.sendMessage(command, content, forceUserId)
    } else {
      let url = msg
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `__plugins__/${pluginId}/${url}`
      }
      return bot.commandHandler.sendMessage(command, `<img src="${url}"/>`, forceUserId)
    }
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

  private loadPlugins(pluginNames: string[], clearOld = false) {
    const newPlugins: IPlugin[] = []
    pluginNames.forEach(pluginName => {
      const plugin = this._loadPlugin(pluginName)
      if (plugin) {
        newPlugins.push(plugin)
      }
    })
    PluginProvider.register(newPlugins, clearOld)
    // todo clear old 需要 delete cache，不过不管也可以
    // 插件更新通知前端
    this.wss.sendToAll({ cmd: 'plugin/list', success: true, data: this.pluginListManifest })
  }

  // 注意：只通过 loadPlugins 调用，以避免频繁调用 PluginProvider 注册，否则每次注册都会造成所有 config 重新计算，太重了
  private _loadPlugin(pluginName: string) {
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
      return plugin
    } catch (e) {
      console.error(`[Plugin] 加载插件 ${pluginName} 出错：`, e)
      return undefined
    }
  }

  // 如果版本号有更新，则删除旧文件，加载新的文件
  private checkOfficialPluginsUpdate() {
    const plugins2reload: string[] = []
    Object.entries(officialPluginsVersions).forEach(([name, version]) => {
      const currentVersion =  PluginProvider.getPlugin(name)?.version
      if (!currentVersion) return
      if (version > currentVersion) {
        console.log(`[Plugin] 检测到插件 ${name} 有更新，即将进行更新。若更新后功能异常，请尝试重新启动软件。`)
        // 考虑到牌堆插件的更新，不删除文件了，反正一般也没必要删除，都是覆盖
        // fs.rmdirSync(path.join(PLUGIN_DIR, name), { recursive: true })
        copyFolderSync(path.join(INTERNAL_PLUGIN_DIR, name), path.join(PLUGIN_DIR, name))
        // 再次加载插件
        plugins2reload.push(name)
      }
    })
    if (plugins2reload.length > 0) {
      this.loadPlugins(plugins2reload)
    }
  }

  // 手动重载插件
  public manualReloadPlugins(pluginNames: string[]) {
    if (pluginNames.length > 0) {
      // 重载指定的插件
      this.loadPlugins(pluginNames)
    } else {
      // 读取并载入所有的插件
      const pluginNames = this.extractOfficialPluginsIfNeed()
      this.loadPlugins(pluginNames, true)
    }
  }

  // 获取插件内容清单（不含插件具体逻辑，用于展示和更新 config）
  get pluginListManifest(): IPluginConfigDisplay[] {
    return PluginProvider.allPlugins.map<IPluginConfigDisplay>(plugin => ({
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
  'io.paotuan.plugin.cardgen': 5,
  'io.paotuan.plugin.draw': 4,
  // 'io.paotuan.plugin.cocrules': 1,
  // 'io.paotuan.plugin.globalflags': 1
  'io.paotuan.plugin.compatible': 1
}

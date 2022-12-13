import type { Wss } from '../../app/wss'
import type {
  IPluginConfig,
  ICustomReplyConfig,
  IPluginRegisterContext,
  IRollDeciderConfig, IAliasRollConfig
} from '../../../interface/config'
import { makeAutoObservable } from 'mobx'
import * as fs from 'fs'
import * as path from 'path'
import { VERSION_CODE, VERSION_NAME } from '../../../interface/version'
import { copyFolderSync } from '../../utils'
import type { IPluginConfigDisplay } from '../../../interface/common'

const INTERNAL_PLUGIN_DIR = path.resolve('./server/plugins')
const PLUGIN_DIR = './plugins'

export class PluginManager {
  private readonly wss: Wss
  private readonly pluginMap: Record<string, IPluginConfig> = {}

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    const pluginNames = this.extractOfficialPluginsIfNeed()
    this.loadPlugins(pluginNames)
    this.checkOfficialPluginsUpdate()
  }

  private get pluginRegisterContext(): IPluginRegisterContext {
    return { versionName: VERSION_NAME, versionCode: VERSION_CODE } // todo: getItem/setItem
  }

  // 自带插件释放到 plugins 文件夹下
  // 如果 plugins 下没有该 plugin 的文件夹，则复制过去
  private extractOfficialPluginsIfNeed() {
    console.log('[Plugin] 开始加载插件')
    if (!fs.existsSync(PLUGIN_DIR)) {
      fs.mkdirSync(PLUGIN_DIR)
    }
    // 读取当前已有插件列表
    const pluginNames = fs
      .readdirSync(PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    // 内置插件列表
    // 此处 ncc 打包时会智能地打到 dist/server/plugins 下，pkg 打包时通过 assets 配置保留文件，因此路径比较 tricky 地保持了一致
    const internalPluginNames = fs
      .readdirSync(INTERNAL_PLUGIN_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
    // 如有新的内置插件不在已有插件列表，则复制过去
    internalPluginNames.forEach(pluginName => {
      if (!pluginNames.includes(pluginName)) {
        copyFolderSync(path.join(INTERNAL_PLUGIN_DIR, pluginName), path.join(PLUGIN_DIR, pluginName))
        pluginNames.push(pluginName) // 记录到插件列表里去
      }
    })
    return pluginNames
  }

  private loadPlugins(pluginNames: string[]) {
    pluginNames.forEach(pluginName => {
      try {
        const fullPath = path.join(process.cwd(), PLUGIN_DIR, pluginName)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const plugin = require(fullPath)(this.pluginRegisterContext) as IPluginConfig
        console.log('[Plugin] 加载插件', pluginName, '->',plugin.id)
        this.pluginMap[plugin.id] = plugin
      } catch (e) {
        console.error(`[Plugin] 加载插件 ${pluginName} 出错：`, e)
      }
    })
  }

  // 如果版本号有更新，则删除旧文件(已加载到内存中，不影响本次使用)，并提示下次打开后更新
  private checkOfficialPluginsUpdate() {
    Object.entries(officialPluginsVersions).forEach(([name, version]) => {
      const currentVersion = this.pluginMap[name]?.version
      if (!currentVersion) return
      if (version > currentVersion) {
        console.log(`[Plugin] 检测到插件 ${name} 有更新，将在下次启动时生效`)
        fs.rmdirSync(path.join(PLUGIN_DIR, name), { recursive: true })
      }
    })
  }

  get pluginListForDisplay(): IPluginConfigDisplay[] {
    return Object.values(this.pluginMap).map<IPluginConfigDisplay>(plugin => ({
      id: plugin.id || '--', // 以防万一空值容错
      name: plugin.name || plugin.id || '--',
      customReply: (plugin.customReply || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description
      })),
      rollDecider: (plugin.rollDecider || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description
      })),
      aliasRoll: (plugin.aliasRoll || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description
      }))
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
  get pluginRollDeciderMap(): Record<string, IRollDeciderConfig> {
    const ret: Record<string, IRollDeciderConfig> = {}
    Object.values(this.pluginMap).forEach(plugin => {
      if (!plugin.rollDecider) return
      plugin.rollDecider.forEach(item => {
        ret[`${plugin.id}.${item.id}`] = item
      })
    })
    return ret
  }

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
}

const officialPluginsVersions = {
  'io.paotuan.plugin.namegen': 1
}

import type { Wss } from '../../app/wss'
import type { IPluginConfig, ICustomReplyConfig, IPluginRegisterContext } from '../../../interface/config'
import { makeAutoObservable } from 'mobx'
import { readdirSync } from 'fs'
import * as path from 'path'
import { VERSION_CODE, VERSION_NAME } from '../../../interface/version'

const INTERNAL_PLUGIN_DIR = path.resolve('./server/plugins')
const PLUGIN_DIR = './plugins'

export class PluginManager {
  private readonly wss: Wss
  private readonly pluginMap: Record<string, IPluginConfig> = {}

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    this.extractOfficialPluginsIfNeed()
    this.loadPlugins()
    this.checkOfficialPluginsUpdate()
  }

  private get pluginRegisterContext(): IPluginRegisterContext {
    return { versionName: VERSION_NAME, versionCode: VERSION_CODE } // todo: getItem/setItem
  }

  // 自带插件释放到 plugins 文件夹下
  // 如果 plugins 下没有该 plugin 的文件夹，则复制过去
  // 如果已经有该 plugin 的文件夹，先加载进来看版本号，如果版本号有更新，则删除旧文件复制新文件，并提示下次打开后更新
  private extractOfficialPluginsIfNeed() {
    // todo
  }

  private loadPlugins() {
    console.log('[Plugin] 开始加载插件')
    // todo 目前直接从 internal 加载
    const pluginPath = INTERNAL_PLUGIN_DIR
    readdirSync(pluginPath, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .forEach(pluginName => {
        try {
          // 此处 ncc 打包时会智能地打到 dist/server/plugins 下，pkg 打包时通过 assets 配置保留文件，因此路径比较 tricky 地保持了一致
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const plugin = require(path.join(pluginPath, pluginName))(this.pluginRegisterContext) as IPluginConfig
          console.log('[Plugin] 加载插件', pluginName, '->',plugin.id)
          this.pluginMap[plugin.id] = plugin
        } catch (e) {
          console.error(`[Plugin] 加载插件 ${pluginName} 出错：`, e)
        }
      })
  }

  private checkOfficialPluginsUpdate() {
    // todo
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

}
//
// const officialPluginsVersions = {
//   'io.paotuan.plugin.example': 1
// }

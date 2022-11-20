import type { Wss } from '../../app/wss'
import type { IPluginConfig } from '../../../interface/config'
import { makeAutoObservable } from 'mobx'

const PLUGIN_DIR = './plugins'

export class PluginManager {
  private readonly wss: Wss
  private readonly pluginMap: Record<string, IPluginConfig> = {} // 后续看要不要放到单独的类里

  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
    this.extractOfficialPluginsIfNeed()
    this.loadPlugins()
    this.checkOfficialPluginsUpdate()
  }

  // 自带插件释放到 plugins 文件夹下
  // 如果 plugins 下没有该 plugin 的文件夹，则复制过去
  // 如果已经有该 plugin 的文件夹，先加载进来看版本号，如果版本号有更新，则删除旧文件复制新文件，并提示下次打开后更新
  private extractOfficialPluginsIfNeed() {
    // todo
  }

  private loadPlugins() {
    // require.context
  }

  private checkOfficialPluginsUpdate() {
    // todo
  }

}

const officialPluginsVersions = {
  'io.paotuan.plugin.example': 1
}

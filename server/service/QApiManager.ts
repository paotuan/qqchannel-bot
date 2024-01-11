import type { Wss } from '../app/wss'
import { makeAutoObservable } from 'mobx'
import { QApi } from './qapi'

/**
 * 管理所有机器人连接
 */
export class QApiManager {
  private readonly wss: Wss
  private readonly apis: Record<string, QApi> = {}

  // singleton
  constructor(wss: Wss) {
    makeAutoObservable<this, 'wss'>(this, { wss: false })
    this.wss = wss
  }

  // 登录 qq 机器人，建立与 qq 服务器的 ws
  login(appid: string, token: string, sandbox: boolean) {
    const oldApi = this.apis[appid]
    if (oldApi) {
      if (oldApi.token === token && oldApi.sandbox === sandbox) {
        console.log('已存在相同的 QQ 服务器连接，可直接复用')
        return // 无需重连
      } else {
        console.log('检测到相同 APPID 但不同 Token/Sandbox 的连接，重新连接...')
        oldApi.disconnect()
      }
    }
    this.apis[appid] = new QApi(appid, token, sandbox, this.wss)
  }

  // 获取对应 appid 的机器人 api
  find(appid: string) {
    return this.apis[appid]
  }
}

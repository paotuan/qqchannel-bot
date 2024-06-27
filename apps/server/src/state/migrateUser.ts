import fs from 'fs'
import { GuildUnionId } from '../adapter/utils'
import { resolveRootDir } from '../utils'
import { IUser, YGuildState } from '@paotuan/types'
import { Platform } from '@paotuan/config'

const USER_DIR = resolveRootDir('user')

export function migrateUser(store: YGuildState, guildUnionId: GuildUnionId) {
  const filenameV2 = `${USER_DIR}/${guildUnionId}.json`
  const [platform, guildId] = guildUnionId.split('_') as [Platform, string]
  const filenameV1 = platform === 'qqguild' ? `${USER_DIR}/${guildId}.json` : undefined
  if (fs.existsSync(filenameV2)) {
    console.log('[User] 迁移旧版用户数据 v2')
    try {
      const str = fs.readFileSync(filenameV2, 'utf8')
      const { list } = JSON.parse(str) as { version: number, list: any[] }
      const users = list.map(adapterUser)
      users.forEach(user => (store.users[user.id] = user))
    } catch (e) {
      console.error(`[Guild] ${filenameV2} 用户列表解析失败`, e)
    } finally {
      // 迁移完毕删除数据
      try {
        fs.unlinkSync(filenameV2)
        filenameV1 && fs.unlinkSync(filenameV1) // 有 v1 数据也一并删除，省的第二次进来读到 v1 数据
      } catch (e) {
        // ignore
      }
    }
    return
  }
  if (filenameV1 && fs.existsSync(filenameV1)) {
    console.log('[User] 迁移旧版用户数据 v1')
    try {
      const str = fs.readFileSync(filenameV1, 'utf8')
      const { list } = JSON.parse(str) as { version: number, list: any[] }
      const users = list.map(adapterUser)
      users.forEach(user => (store.users[user.id] = user))
    } catch (e) {
      console.error(`[Guild] ${filenameV1} 用户列表解析失败`, e)
    } finally {
      try {
        fs.unlinkSync(filenameV1)
      } catch (e) {
        // ignore
      }
    }
  }
}

function adapterUser(item: any): IUser {
  return {
    id: item.id,
    name: item.name || item.nick || item.username,
    avatar: item.avatar,
    isBot: item.isBot ?? item.bot,
    deleted: item.deleted
  }
}

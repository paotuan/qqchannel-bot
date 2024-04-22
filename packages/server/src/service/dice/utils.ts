import type { UserRole } from '@paotuan/config'

// 用户权限 id 适配 理论上不要放在这里
// https://bot.q.qq.com/wiki/develop/nodesdk/model/role.html#DefaultRoleIDs
// todo kook 场景
export function convertRoleIds(ids: string[] = []): UserRole {
  if (ids.includes('4')) {
    return 'admin'
  } else if (ids.includes('2') || ids.includes('5')) {
    return 'manager'
  } else {
    return 'user'
  }
}

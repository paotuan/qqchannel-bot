import { defineStore } from 'pinia'
import { computed } from 'vue'
import { yGuildStoreRef } from './ystore'

export const useUserStore = defineStore('user', () => {

  const userMap = computed(() => yGuildStoreRef.value?.users ?? {})
  const list = computed(() => Object.values(userMap.value))
  const enabledUserList = computed(() => list.value.filter(user => !user.isBot && !user.deleted))

  const of = (id: string) => userMap.value[id]
  const nickOf = (id: string) => of(id)?.name ?? ''

  const deleteUsers = (ids: string[]) => {
    ids.forEach(id => {
      const user = of(id)
      user && (user.deleted = true)
    })
  }

  return {
    enabledUserList,
    of,
    nickOf,
    deleteUsers
  }
})

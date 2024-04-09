<template>
  <UserSelectDropdown :options="options" class="dropdown-end" @select="select($event)">
    <input
        v-model="keyword"
        type="text"
        placeholder="搜索玩家或输入名字创建敌人/NPC, 回车键确认"
        class="input input-bordered input-sm w-full"
        @keyup.enter="keydownEnter"
    />
  </UserSelectDropdown>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '../../../store/user'
import { useCardStore } from '../../../store/card'
import type { IUser } from '@paotuan/types'
import { useSceneStore } from '../../../store/scene'
import UserSelectDropdown from '../../../components/user/UserSelectDropdown.vue'

const userStore = useUserStore()
const cardStore = useCardStore()
// 已关联人物卡用户
const haveCardUsers = computed(() => userStore.enabledUserList.filter(u => cardStore.getCardOfUser(u.id)))
// 未关联人物卡用户
const noCardUsers = computed(() => userStore.enabledUserList.filter(u => !cardStore.getCardOfUser(u.id)))

// 搜索相关
const keyword = ref('')
const keywordContains = (user: IUser) => {
  const search = keyword.value.toLowerCase()
  return user.nick.toLowerCase().includes(search) || user.username.toLowerCase().includes(search)
}
const haveCardUsersAfterSearch = computed(() => haveCardUsers.value.filter(user => keywordContains(user)))
const noCardUsersAfterSearch = computed(() => noCardUsers.value.filter(user => keywordContains(user)).slice(0, 100)) // 默认展示 100 条

const options = computed(() => [
  { id: '1', name: '已关联人物卡', children: haveCardUsersAfterSearch.value as IUser[] },
  { id: '2', name: '未关联人物卡', children: noCardUsersAfterSearch.value as IUser[] }
])

// 点击选择玩家进入场景
const sceneStore = useSceneStore()
const select = (user: IUser) => {
  const userCard = cardStore.getCardOfUser(user.id)
  // 如果是 coc 人物卡，自动代入敏捷值作为 seq；如果是 dnd 则代入 seq2
  let seq = NaN
  if (userCard?.type === 'coc') {
    seq = userCard.getEntry('敏捷')?.value ?? NaN
  }
  sceneStore.addCharacter({ type: 'actor', userId: user.id, seq, seq2: NaN })
  blur()
}

// 在输入框按下回车，选择第一个匹配项。若无匹配项则认为是生成 npc
const keydownEnter = () => {
  const firstOption = haveCardUsersAfterSearch.value[0] || noCardUsersAfterSearch.value[0]
  if (firstOption) {
    select(firstOption)
  } else {
    sceneStore.addCharacter({ type: 'npc', userId: keyword.value.trim(), seq: NaN, seq2: NaN })
    blur()
  }
}

const blur = () => {
  // https://www.reddit.com/r/tailwindcss/comments/rm0rpu/tailwind_and_daisyui_how_to_fix_the_issue_with/
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
  keyword.value = '' // 同时清空输入框
}
</script>

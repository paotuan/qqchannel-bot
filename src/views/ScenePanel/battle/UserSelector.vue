<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0">
      <input
        v-model="keyword"
        type="text"
        placeholder="搜索玩家或输入名字创建敌人/NPC, 回车键确认"
        class="input input-bordered input-sm w-full"
        @keyup.enter="keydownEnter"
      />
    </label>
    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-96 -ml-1 mt-2 overflow-y-auto flex-nowrap">
      <li class="menu-title"><span>已关联人物卡</span></li>
      <li v-for="user in haveCardUsersAfterSearch" :key="user.id">
        <a @click="select(user)">
          <div class="avatar">
            <div class="w-6 rounded-full">
              <img :src="user.avatar" :alt="user.nick" />
            </div>
          </div>
          <div>{{ user.nick }}</div>
        </a>
      </li>
      <li class="menu-title"><span>未关联人物卡</span></li>
      <li v-for="user in noCardUsersAfterSearch" :key="user.id">
        <a @click="select(user)">
          <div class="avatar">
            <div class="w-6 rounded-full">
              <img :src="user.avatar" :alt="user.nick" />
            </div>
          </div>
          <div>{{ user.nick }}</div>
        </a>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '../../../store/user'
import { useCardStore } from '../../../store/card'
import type { IUser } from '../../../../interface/common'
import { useSceneStore } from '../../../store/scene'

const userStore = useUserStore()
const cardStore = useCardStore()
// 已关联人物卡用户
const haveCardUsers = computed(() => userStore.list.filter(u => cardStore.getCardOfUser(u.id)))
// 未关联人物卡用户
const noCardUsers = computed(() => userStore.list.filter(u => !cardStore.getCardOfUser(u.id)))

// 搜索相关
const keyword = ref('')
const keywordContains = (user: IUser) => {
  const search = keyword.value.toLowerCase()
  return user.nick.toLowerCase().includes(search) || user.username.toLowerCase().includes(search)
}
const haveCardUsersAfterSearch = computed(() => haveCardUsers.value.filter(user => keywordContains(user)))
const noCardUsersAfterSearch = computed(() => noCardUsers.value.filter(user => keywordContains(user)).slice(0, 100)) // 默认展示 100 条

// 点击选择玩家进入场景
const sceneStore = useSceneStore()
const select = (user: IUser) => {
  const userCard = cardStore.getCardOfUser(user.id)
  // 如果是 coc 人物卡，自动代入敏捷值作为 seq；如果是 dnd 则代入 seq2
  const seq = userCard ? userCard.props.敏捷 : NaN
  sceneStore.addCharacter({ type: 'actor', userId: user.id, seq, seq2: NaN })
  blur()
}

// 在输入框按下回车，选择第一个匹配项。若无匹配项则认为是生成 npc
const keydownEnter = () => {
  const firstOption = haveCardUsersAfterSearch.value[0] || noCardUsersAfterSearch.value[0]
  if (firstOption) {
    select(firstOption)
  } else {
    sceneStore.addCharacter({ type: 'npc', userId: keyword.value.trim(), seq: NaN, seq2: NaN, embedCard: { hp: NaN, maxHp: NaN, ext: '' } })
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

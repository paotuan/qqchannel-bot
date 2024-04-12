<template>
  <div>
    <!-- basic -->
    <div class="flex gap-2 items-center flex-wrap mb-2">
      <span class="text-sm font-bold">{{ cardData.name }}</span>
      <CardToolbar />
    </div>
    <div class="flex gap-2">
      <div class="w-0" style="flex: 1 1 0">
        <!-- ext -->
        <textarea v-model="cardData.ext" class="textarea textarea-bordered w-full" placeholder="输入任意备注信息" @change="markEdited" />
      </div>
      <div class="w-0" style="flex: 2 1 0">
        <!-- skills -->
        <table class="table table-compact table-zebra w-full">
          <thead>
          <tr>
            <th colspan="2" class="w-1/4">技能</th>
            <th colspan="2" class="w-1/4">技能</th>
            <th colspan="2" class="w-1/4">技能</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(sublist, i) in skills" :key="i">
            <template v-for="(skill, j) in sublist">
              <template v-if="skill">
                <td :key="`name-${j}`" class="max-w-xs">
                  <button class="btn btn-xs btn-ghost font-medium">{{ skill }}</button>
                </td>
                <td :key="`value-${j}`" class="flex items-center justify-between group">
                  <number-input v-model="cardData.skills[skill]" class="input input-ghost input-xs text-sm w-14"/>
                  <CardMoreAction class="invisible group-hover:visible" :expression="skill" @delete="deleteSkill(skill)" />
                </td>
              </template>
            </template>
          </tr>
          </tbody>
        </table>
        <!-- abilities -->
        <table class="table table-compact table-zebra w-full mt-4">
          <thead>
          <tr>
            <th class="w-1/4">武器/能力名</th>
            <th>表达式</th>
            <th class="w-8"></th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(ability, i) in cardData.abilities" :key="i" class="group">
            <td><text-input v-model="ability.key" class="input input-ghost input-xs w-full"/></td>
            <td><text-input v-model="ability.value" class="input input-ghost input-xs w-full"/></td>
            <td style="padding: 0">
              <CardMoreAction class="invisible group-hover:visible" :expression="ability.key" @delete="deleteAbility(i)" />
            </td>
          </tr>
          <tr>
            <td colspan="4"><button class="btn btn-xs btn-ghost" @click="newAbility">+ 新增一行</button></td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useCardStore } from '../../../store/card'
import { computed, ComputedRef, inject } from 'vue'
import { SELECTED_CARD } from '../utils'
import type { GeneralCard } from '@paotuan/card'
import CardToolbar from '../CardToolbar.vue'
import NumberInput from '../NumberInput.vue'
import TextInput from '../TextInput.vue'
import CardMoreAction from '../CardMoreAction.vue'

const cardStore = useCardStore()
const generalCard = inject<ComputedRef<GeneralCard>>(SELECTED_CARD)! // 此处可以确保是 general card
const cardData = computed(() => generalCard.value.data)

// 物品表格 分三栏
const skills = computed(() => {
  const skillList = Object.keys(cardData.value.skills)
  const length = Math.ceil(skillList.length / 3)
  return new Array(length).fill(0).map((_, i) => [skillList[i * 3], skillList[i * 3 + 1], skillList[i * 3 + 2]])
})

// 标记人物卡被编辑
const markEdited = () => {
  cardData.value.lastModified = Date.now()
  cardStore.markCardEdited(cardData.value.name)
}

// 新增一条 ability
const newAbility = () => {
  cardData.value.abilities.push({ key: '', value: '' })
  // 不用标记编辑，因为单纯添加不后续编辑的话就相当于没有添加
}

// 删除一条 ability
const deleteAbility = (index: number) => {
  cardData.value.abilities.splice(index, 1)
  markEdited()
}

// 删除一条 skill
const deleteSkill = (name: string) => {
  delete cardData.value.skills[name]
  markEdited()
}
</script>
<style scoped>
.table-compact :where(td) {
  padding: 0.25rem;
}

.table-zebra tbody tr:nth-child(even) td {
  --tw-bg-opacity: 0.5;
}

.table input:focus {
  outline: none;
}
</style>

<template>
  <div v-if="cardStore.selectedCard">
    <!-- basic -->
    <div class="flex gap-2 items-center flex-wrap mb-2">
      <span class="text-sm font-bold">{{ card.basic.name }}</span>
      <text-input v-model="card.basic.gender" placeholder="性别" class="input input-bordered input-xs w-14"/>
      <span class="inline-flex items-center gap-0.5">
          <number-input v-model="card.basic.age" placeholder="年龄" class="input input-bordered input-xs w-14"/>
          <span class="text-sm">岁</span>
        </span>
      <span class="inline-flex items-center gap-0.5">
          <span class="text-sm">是</span>
          <text-input v-model="card.basic.job" placeholder="职业" class="input input-bordered input-xs w-20"/>
        </span>
    </div>
    <div class="flex gap-2">
      <div style="flex: 1 1 0">
        <!-- basic -->
        <div>
          <table class="table table-compact w-full">
            <thead>
            <tr>
              <th>体力</th>
              <th>理智</th>
              <th>幸运</th>
              <th>魔法</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>
                <number-input v-model="card.basic.hp" class="input input-ghost input-xs text-sm w-14"/>
              </td>
              <td>
                <number-input v-model="card.basic.san" class="input input-ghost input-xs text-sm w-14"/>
              </td>
              <td>
                <number-input v-model="card.basic.luck" class="input input-ghost input-xs text-sm w-14"/>
              </td>
              <td>
                <number-input v-model="card.basic.mp" class="input input-ghost input-xs text-sm w-14"/>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- props -->
        <div class="mt-4">
          <table class="table table-compact table-zebra w-full">
            <thead>
            <tr>
              <th>属性</th>
              <th>&nbsp;&nbsp;%</th>
              <th>半值</th>
              <th>1/5值</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="prop in Object.keys(card.props)" :key="prop">
              <td>
                <button class="btn btn-xs btn-ghost font-medium">{{ prop }}</button>
              </td>
              <td class="w-1/4">
                <number-input v-model="card.props[prop]" class="input input-ghost input-xs text-sm w-full"/>
              </td>
              <td class="text-gray-400 text-xs">{{ Math.floor(card.props[prop] / 2) }}</td>
              <td class="text-gray-400 text-xs">{{ Math.floor(card.props[prop] / 5) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="flex: 2 1 0">
        <table class="table table-compact table-zebra w-full">
          <thead>
          <tr>
            <th>技能</th>
            <th>&nbsp;%</th>
            <th>技能</th>
            <th>&nbsp;%</th>
            <th>技能</th>
            <th>&nbsp;%</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(sublist, i) in skills" :key="i">
            <template v-for="(skill, j) in sublist">
              <template v-if="skill">
                <td :key="`name-${j}`" :class="{ highlight: !!card.meta.skillGrowth[skill] }">
                  <button class="btn btn-xs btn-ghost font-medium" @click="cardStore.markSkillGrowth(cardStore.selectedCard, skill)">
                    {{ skill }}
                  </button>
                </td>
                <td :key="`value-${j}`" :class="{ highlight: !!card.meta.skillGrowth[skill] }">
                  <number-input v-model="card.skills[skill]" class="input input-ghost input-xs text-sm w-14"/>
                  <span class="text-gray-400 text-xs">
                    {{ Math.floor(card.skills[skill] / 2) }}/{{ Math.floor(card.skills[skill] / 5) }}
                  </span>
                </td>
              </template>
            </template>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useCardStore } from '../../../store/card'
import { computed, ref, watch } from 'vue'
import TextInput from './TextInput.vue'
import NumberInput from './NumberInput.vue'
import type { ICard } from '../../../../interface/common'

const cardStore = useCardStore()
const card = computed(() => cardStore.selectedCard?.card)


// 分三栏显示，技能值越高越前面
// 缓存一下选择卡片时的技能值顺序，避免编辑过程中实时数值改变导致排序跳动
const originCard = ref<ICard | undefined>()
watch(
  () => card.value,
  () => {
    if (card.value) {
      originCard.value = JSON.parse(JSON.stringify(card.value))
    }
  },
  { immediate: true }
)
const skills = computed(() => {
  if (!originCard.value) return []
  const cardValue = originCard.value
  const skillList = Object.keys(cardValue.skills).sort((s1, s2) => cardValue.skills[s2] - cardValue.skills[s1])
  const length = Math.ceil(skillList.length / 3)
  return new Array(length).fill(0).map((_, i) => [skillList[i * 3], skillList[i * 3 + 1], skillList[i * 3 + 2]])
})
</script>
<style scoped>
.table-compact :where(td) {
  padding: 0.25rem;
}

.table-zebra tbody tr:nth-child(even) td {
  --tw-bg-opacity: 0.5;
}

.table input[type=number]:focus {
  outline: none;
}

.highlight {
  background: hsl(var(--s)) !important;
}
</style>

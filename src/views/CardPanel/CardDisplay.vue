<template>
  <div v-if="card">
    <!-- basic -->
    <div class="flex gap-2 items-center flex-wrap mb-2">
      <span class="text-sm font-bold">{{ cardnn.name }}</span>
      <text-input v-model="cardnn.basic.gender" placeholder="性别" class="input input-bordered input-xs w-14"/>
      <span class="inline-flex items-center gap-0.5">
          <number-input v-model="cardnn.basic.AGE" placeholder="年龄" class="input input-bordered input-xs w-14"/>
          <span class="text-sm">岁</span>
        </span>
      <span class="inline-flex items-center gap-0.5">
          <span class="text-sm">是</span>
          <text-input v-model="cardnn.basic.job" placeholder="职业" class="input input-bordered input-xs w-20"/>
        </span>
      <card-add-attribute @submit="addSkillsBatch" />
      <button class="btn btn-xs btn-primary" :disabled="!cardStore.isEdited(cardnn)"
              @click="cardStore.requestSaveCard(cardnn)">保存修改
      </button>
      <button class="btn btn-xs btn-error" @click="deleteCard">删除人物卡</button>
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
                <number-input v-model="cardnn.basic.HP" class="input input-ghost input-xs text-sm w-14"/>
              </td>
              <td>
                <number-input v-model="cardnn.basic.SAN" class="input input-ghost input-xs text-sm w-14"/>
              </td>
              <td>
                <number-input v-model="cardnn.basic.LUCK" class="input input-ghost input-xs text-sm w-14"/>
              </td>
              <td>
                <number-input v-model="cardnn.basic.MP" class="input input-ghost input-xs text-sm w-14"/>
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
            <tr v-for="prop in propKeyOf(cardnn)" :key="prop">
              <td>
                <button class="btn btn-xs btn-ghost font-medium">{{ prop }}</button>
              </td>
              <td class="w-1/4">
                <number-input v-model="cardnn.props[prop]" class="input input-ghost input-xs text-sm w-full"/>
              </td>
              <td class="text-gray-400 text-xs">{{ Math.floor(cardnn.props[prop] / 2) }}</td>
              <td class="text-gray-400 text-xs">{{ Math.floor(cardnn.props[prop] / 5) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- ext -->
        <textarea v-model="cardnn.ext" class="textarea textarea-bordered w-full mt-4" placeholder="输入任意备注信息" @change="markEdited" />
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
                <td :key="`name-${j}`" :class="{ highlight: !!cardnn.meta.skillGrowth[skill] }">
                  <button class="btn btn-xs btn-ghost font-medium"
                          @click="cardStore.markSkillGrowth(cardnn, skill)">
                    {{ skill }}
                  </button>
                </td>
                <td :key="`value-${j}`" class="flex items-center justify-between group" :class="{ highlight: !!cardnn.meta.skillGrowth[skill] }">
                  <span>
                    <number-input v-model="cardnn.skills[skill]" class="input input-ghost input-xs text-sm w-14"/>
                    <span class="text-gray-400 text-xs">
                      {{ Math.floor(cardnn.skills[skill] / 2) }}/{{ Math.floor(cardnn.skills[skill] / 5) }}
                    </span>
                  </span>
                  <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteSkill(skill)">
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </td>
              </template>
            </template>
          </tr>
          </tbody>
        </table>
        <div class="mt-4 flex gap-2 items-start">
          <table class="table table-compact table-zebra w-full" style="flex: 4 1 0">
            <thead>
            <tr>
              <th class="w-1/4">武器/能力名</th>
              <th class="w-1/4">表达式</th>
              <th>备注</th>
              <th class="w-8"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(ability, i) in cardnn.abilities" :key="i" class="group">
              <td>
                <text-input v-model="ability.name" class="input input-ghost input-xs w-full"/>
              </td>
              <td>
                <text-input v-model="ability.expression" class="input input-ghost input-xs w-full"/>
              </td>
              <td>
                <text-input v-model="ability.ext" class="input input-ghost input-xs w-full"/>
              </td>
              <td style="padding: 0">
                <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteAbility(i)">
                  <XMarkIcon class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <button class="btn btn-xs btn-ghost" @click="newAbility">+ 新增一行</button>
              </td>
            </tr>
            </tbody>
          </table>
          <table class="table table-compact w-full" style="flex: 1 1 0">
            <thead>
            <tr><th>战斗属性</th></tr>
            </thead>
            <tbody>
            <tr><td>DB: {{ dbAndBuild[0] }}</td></tr>
            <tr><td>体格: {{ dbAndBuild[1] }}</td></tr>
            <tr><td>闪避: {{ cardnn.skills['闪避'] || 0 }}/{{ Math.floor((cardnn.skills['闪避'] || 0) / 2) }}/{{ Math.floor((cardnn.skills['闪避'] || 0) / 5) }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { addAttributesBatch, useCardStore } from '../../store/card'
import { computed, ref, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import TextInput from './TextInput.vue'
import NumberInput from './NumberInput.vue'
import { getDBAndBuild } from '../../../interface/coc'
import CardAddAttribute from './CardAddAttribute.vue'
import type { ICocCardData } from '../../../interface/card/coc'

const cardStore = useCardStore()
const card = computed(() => cardStore.selectedCard)

// region 给模板用的，因为 ts 不认识 v-if
const cardnn = computed(() => card.value!)
const propKeyOf = (card: ICocCardData) => {
  return Object.keys(card.props) as Array<keyof typeof card.props>
}
const dbAndBuild = computed(() => getDBAndBuild(cardnn.value))
// endregion 给模板用的

// 技能按数值排序。缓存一下选择卡片时的技能值顺序，避免编辑过程中实时数值改变导致排序跳动
const skillsSortList = ref<string[]>([])
const updateSortList = (cardValue: ICocCardData | null) => {
  if (cardValue) {
    skillsSortList.value = Object.keys(cardValue.skills).sort((s1, s2) => cardValue.skills[s2] - cardValue.skills[s1])
  } else {
    skillsSortList.value = []
  }
}
watch(card, updateSortList, { immediate: true })
// skills grid 分三栏展示
const skills = computed(() => {
  const skillList = skillsSortList.value
  const length = Math.ceil(skillList.length / 3)
  return new Array(length).fill(0).map((_, i) => [skillList[i * 3], skillList[i * 3 + 1], skillList[i * 3 + 2]])
})

// 删除人物卡二次确认
const deleteCard = () => {
  if (card.value) {
    if (window.confirm('确定要删除这张人物卡吗？')) {
      cardStore.deleteCard(card.value)
    }
  }
}

// 标记人物卡被编辑
const markEdited = () => {
  if (card.value) {
    cardStore.markCardEdited(card.value)
  }
}

// 新增一条 ability
const newAbility = () => {
  if (card.value) {
    card.value.abilities.push({ name: '', expression: '', ext: '' })
  }
}

// 删除一条 ability
const deleteAbility = (index: number) => {
  if (card.value) {
    card.value.abilities.splice(index, 1)
    markEdited()
  }
}

// 删除一条 skill
const deleteSkill = (name: string) => {
  if (card.value) {
    delete card.value.skills[name]
    delete card.value.meta.skillGrowth[name] // 如有成长标记也一起删了
    // 从 skillsSortList 也删除
    const index = skillsSortList.value.indexOf(name)
    if (index >= 0) {
      skillsSortList.value.splice(index, 1)
    }
    markEdited()
  }
}

const addSkillsBatch = (rawText: string) => {
  if (card.value) {
    addAttributesBatch(card.value, rawText)
    updateSortList(card.value)
    markEdited()
  }
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

.highlight {
  background: hsl(var(--s)) !important;
}
</style>

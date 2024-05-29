<template>
  <div>
    <!-- basic -->
    <div class="flex gap-2 items-center flex-wrap mb-2">
      <span class="text-sm font-bold">{{ cardData.name }}</span>
      <text-input v-model="cardData.basic.gender" placeholder="性别" class="input input-bordered input-xs w-14"/>
      <span class="inline-flex items-center gap-0.5">
        <number-input v-model="cardData.basic.AGE" placeholder="年龄" class="input input-bordered input-xs w-14"/>
        <span class="text-sm">岁</span>
      </span>
      <span class="inline-flex items-center gap-0.5">
        <span class="text-sm">是</span>
        <text-input v-model="cardData.basic.job" placeholder="职业" class="input input-bordered input-xs w-20"/>
      </span>
      <CardToolbar />
    </div>
    <div class="flex gap-2">
      <div class="w-0" style="flex: 1 1 0">
        <!-- basic -->
        <div>
          <table class="table table-sm table-zebra w-full">
            <thead>
            <tr>
              <th class="w-1/3">状态</th>
              <th></th>
              <th>%</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td><button class="btn btn-xs btn-ghost font-medium">体力</button></td>
              <td><number-input v-model="cocCard.HP" class="input input-ghost input-xs text-sm w-14"/>/{{ cocCard.MAXHP }}</td>
              <td></td>
            </tr>
            <tr>
              <td><button class="btn btn-xs btn-ghost font-medium">理智</button></td>
              <td><number-input v-model="cocCard.SAN" class="input input-ghost input-xs text-sm w-14"/>/{{ cocCard.MAXSAN }}</td>
              <td class="opacity-60 text-xs">{{ Math.floor(cocCard.SAN / 2) }}/{{ Math.floor(cocCard.SAN / 5) }}</td>
            </tr>
            <tr>
              <td><button class="btn btn-xs btn-ghost font-medium">克苏鲁神话</button></td>
              <td><number-input v-model="cocCard.CM" class="input input-ghost input-xs text-sm w-14"/></td>
              <td class="opacity-60 text-xs">{{ Math.floor(cocCard.CM / 2) }}/{{ Math.floor(cocCard.CM / 5) }}</td>
            </tr>
            <tr>
              <td><button class="btn btn-xs btn-ghost font-medium">魔法</button></td>
              <td><number-input v-model="cocCard.MP" class="input input-ghost input-xs text-sm w-14"/>/{{ cocCard.MAXMP }}</td>
              <td></td>
            </tr>
            <tr>
              <td><button class="btn btn-xs btn-ghost font-medium">信用评级</button></td>
              <td><number-input v-model="cardData.basic.信用" class="input input-ghost input-xs text-sm w-14"/></td>
              <td class="opacity-60 text-xs">{{ Math.floor(cardData.basic.信用 / 2) }}/{{ Math.floor(cardData.basic.信用 / 5) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- props -->
        <div class="mt-4">
          <table class="table table-sm table-zebra w-full">
            <thead>
            <tr>
              <th>属性</th>
              <th>&nbsp;&nbsp;%</th>
              <th>半值</th>
              <th>1/5值</th>
              <th class="w-8"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="prop in propKeyOf(cardData)" :key="prop" class="group">
              <td><button class="btn btn-xs btn-ghost font-medium">{{ prop }}</button></td>
              <td class="w-1/4"><number-input v-model="cardData.props[prop]" class="input input-ghost input-xs text-sm w-full"/></td>
              <td class="opacity-60 text-xs">{{ Math.floor(cardData.props[prop] / 2) }}</td>
              <td class="opacity-60 text-xs">{{ Math.floor(cardData.props[prop] / 5) }}</td>
              <td style="padding: 0">
                <CardMoreAction class="invisible group-hover:visible" :expression="prop" :deletable="false" />
              </td>
            </tr>
            <tr class="group">
              <td><button class="btn btn-xs btn-ghost font-medium">幸运</button></td>
              <td class="w-1/4"><number-input v-model="cardData.basic.LUCK" class="input input-ghost input-xs text-sm w-full"/></td>
              <td class="opacity-60 text-xs">{{ Math.floor(cardData.basic.LUCK / 2) }}</td>
              <td class="opacity-60 text-xs">{{ Math.floor(cardData.basic.LUCK / 5) }}</td>
              <td style="padding: 0">
                <CardMoreAction class="invisible group-hover:visible" expression="幸运" :deletable="false" />
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- ext -->
        <textarea v-model="cardData.ext" class="textarea textarea-bordered w-full mt-4" placeholder="输入任意备注信息" @change="markEdited" />
      </div>
      <div class="w-0" style="flex: 2 1 0">
        <table class="table table-sm table-zebra w-full">
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
                <td :key="`name-${j}`" :class="{ highlight: !!cardData.meta.skillGrowth[skill] }">
                  <button class="btn btn-xs btn-ghost font-medium" @click="toggleSkillGrowth(skill)">{{ skill }}</button>
                </td>
                <td :key="`value-${j}`" class="flex items-center justify-between group" :class="{ highlight: !!cardData.meta.skillGrowth[skill] }">
                  <span>
                    <number-input v-model="cardData.skills[skill]" class="input input-ghost input-xs text-sm w-14"/>
                    <span class="opacity-60 text-xs">{{ Math.floor(cardData.skills[skill] / 2) }}/{{ Math.floor(cardData.skills[skill] / 5) }}</span>
                  </span>
                  <CardMoreAction class="invisible group-hover:visible" :expression="skill" @delete="deleteSkill(skill)" />
                </td>
              </template>
            </template>
          </tr>
          </tbody>
        </table>
        <div class="mt-4 flex gap-2 items-start">
          <table class="table table-sm table-zebra w-full" style="flex: 4 1 0">
            <thead>
            <tr>
              <th class="w-1/4">武器/能力名</th>
              <th class="w-1/4">表达式</th>
              <th>备注</th>
              <th class="w-8"></th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(ability, i) in cardData.abilities" :key="i" class="group">
              <td><text-input v-model="ability.name" class="input input-ghost input-xs w-full"/></td>
              <td><text-input v-model="ability.expression" class="input input-ghost input-xs w-full"/></td>
              <td><text-input v-model="ability.ext" class="input input-ghost input-xs w-full"/></td>
              <td style="padding: 0">
                <CardMoreAction class="invisible group-hover:visible" :expression="ability.name" @delete="deleteAbility(i)" />
              </td>
            </tr>
            <tr>
              <td colspan="4"><button class="btn btn-xs btn-ghost" @click="newAbility">+ 新增一行</button></td>
            </tr>
            </tbody>
          </table>
          <table class="table table-sm w-full" style="flex: 1 1 0">
            <thead>
            <tr><th>战斗属性</th></tr>
            </thead>
            <tbody>
            <tr><td>DB: {{ cocCard.DB }}</td></tr>
            <tr><td>体格: {{ cocCard.体格 }}</td></tr>
            <tr><td>闪避: {{ cardData.skills['闪避'] || 0 }}/{{ Math.floor((cardData.skills['闪避'] || 0) / 2) }}/{{ Math.floor((cardData.skills['闪避'] || 0) / 5) }}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useCardStore } from '../../../store/card'
import { computed, ComputedRef, inject } from 'vue'
import TextInput from '../TextInput.vue'
import NumberInput from '../NumberInput.vue'
import type { CocCard, ICocCardData } from '@paotuan/card'
import CardToolbar from '../CardToolbar.vue'
import { SELECTED_CARD } from '../utils'
import CardMoreAction from '../CardMoreAction.vue'

const cardStore = useCardStore()
const cocCard = inject<ComputedRef<CocCard>>(SELECTED_CARD)! // 此处可以确保是 coc card
const cardData = computed(() => cocCard.value.data)

const propKeyOf = (card: ICocCardData) => {
  return Object.keys(card.props) as Array<keyof typeof card.props>
}

// skills grid 分三栏展示
const skills = computed(() => {
  const skillList = Object.keys(cardData.value.skills)
  const length = Math.ceil(skillList.length / 3)
  return new Array(length).fill(0).map((_, i) => [skillList[i * 3], skillList[i * 3 + 1], skillList[i * 3 + 2]])
})

// 技能成长标记/取消
const toggleSkillGrowth = (skill: string) => {
  const targetCard = cocCard.value
  const marked = !!targetCard.data.meta.skillGrowth[skill]
  const updated = !marked ? targetCard.markSkillGrowth(skill) : targetCard.cancelSkillGrowth(skill)
  if (updated) {
    cardStore.markCardEdited(targetCard.name)
  }
}

// 标记人物卡被编辑
const markEdited = () => {
  cardData.value.lastModified = Date.now()
  cardStore.markCardEdited(cocCard.value.name)
}

// 新增一条 ability
const newAbility = () => {
  cardData.value.abilities.push({ name: '', expression: '', ext: '' })
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
  delete cardData.value.meta.skillGrowth[name] // 如有成长标记也一起删了
  markEdited()
}
</script>
<style scoped>
.table-sm :where(td) {
  padding: 0.25rem;
}

.table-zebra tbody tr:nth-child(even) td {
  --tw-bg-opacity: 0.5;
}

.table input:focus {
  outline: none;
}

.highlight {
  color: oklch(var(--ac)) !important;
  background: oklch(var(--a)) !important;
}
</style>

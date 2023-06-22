<template>
  <div>
    <!-- basic -->
    <div class="flex gap-2 items-center flex-wrap mb-2">
      <span class="text-sm font-bold">{{ cardData.name }}</span>
      <text-input v-model="cardData.info.gender" placeholder="性别" class="input input-bordered input-xs w-14"/>
      <span class="inline-flex items-center gap-0.5">
        <number-input v-model="cardData.info.age" placeholder="年龄" class="input input-bordered input-xs w-14"/>
        <span class="text-sm">岁</span>
      </span>
      <span class="inline-flex items-center gap-0.5">
        <span class="text-sm">是</span>
        <text-input v-model="cardData.info.job" placeholder="职业" class="input input-bordered input-xs w-20"/>
      </span>
      <span class="inline-flex items-center gap-0.5">
        <span class="text-sm">种族</span>
        <text-input v-model="cardData.info.race" placeholder="种族" class="input input-bordered input-xs w-20"/>
      </span>
      <span class="inline-flex items-center gap-0.5">
        <span class="text-sm">阵营</span>
        <text-input v-model="cardData.info.camp" placeholder="阵营" class="input input-bordered input-xs w-20"/>
      </span>
      <CardToolbar />
    </div>
    <div class="flex gap-2">
      <div class="w-0" style="flex: 1 1 0">
        <!-- 基础信息 -->
        <div>
          <table class="table table-compact table-zebra w-full">
            <thead>
            <tr>
              <th colspan="4">基础信息</th>
<!--              <th></th>-->
<!--              <th></th>-->
<!--              <th></th>-->
            </tr>
            </thead>
            <tbody>
            <tr>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">EXP</button></td>
              <td colspan="3"><number-input v-model="cardData.basic.EXP" class="input input-ghost input-xs text-sm w-full"/></td>
            </tr>
            <tr>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">LV</button></td>
              <td><number-input v-model="cardData.basic.LV" class="input input-ghost input-xs text-sm w-14"/></td>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">熟练</button></td>
              <td><number-input v-model="cardData.basic.熟练" class="input input-ghost input-xs text-sm w-14"/></td>
            </tr>
            <tr>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">HP</button></td>
              <td colspan="3">
                <number-input v-model="dndCard.HP" class="input input-ghost input-xs text-sm w-20"/>/
                <number-input v-model="cardData.basic.MAXHP" class="input input-ghost input-xs text-sm w-20"/>
              </td>
            </tr>
            <tr>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">死亡豁免</button></td>
              <td colspan="3">
                <span class="text-xs">成功</span><number-input v-model="cardData.meta.deathSaving.success" class="input input-ghost input-xs text-sm w-14"/>
                <span class="text-xs">失败</span><number-input v-model="cardData.meta.deathSaving.failure" class="input input-ghost input-xs text-sm w-14"/>
              </td>
            </tr>
            <tr>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">AC</button></td>
              <td><number-input v-model="cardData.basic.AC" class="input input-ghost input-xs text-sm w-14"/></td>
            </tr>
            <tr>
              <td class="w-1/4"><button class="btn btn-xs btn-ghost font-medium">先攻</button></td>
              <td colspan="3">
                <span class="text-xs">临时值</span><number-input v-model="cardData.basic.先攻临时" allow-negative class="input input-ghost input-xs text-sm w-14"/>
                <span class="text-xs font-medium text-gray-400">总值&nbsp;&nbsp;{{ modifiedValueOf('敏捷') + cardData.basic.先攻临时 }}</span>
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
              <th class="w-1/4">属性</th>
              <th class="w-1/4">总值</th>
              <th class="w-1/4">调整值</th>
              <th class="w-1/4">豁免</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="prop in propKeys" :key="prop" :class="{ highlight: !!cardData.meta.experienced[prop] }">
              <td><button class="btn btn-xs btn-ghost font-medium" @click="toggleSkillGrowth(prop)">{{ prop }}</button></td>
              <td><number-input v-model="cardData.props[prop]" class="input input-ghost input-xs text-sm w-full"/></td>
              <td>{{ modifiedValueOf(prop) }}</td>
              <td>{{ savingValueOf(prop) }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- ext -->
        <textarea v-model="cardData.ext" class="textarea textarea-bordered w-full mt-4" placeholder="输入任意备注信息" @change="markEdited" />
      </div>
      <div class="w-0" style="flex: 2 1 0">
        <table class="table table-compact table-zebra w-full">
          <thead>
          <tr>
            <th>技能</th>
            <th>修正</th>
            <th>技能</th>
            <th>修正</th>
            <th>技能</th>
            <th>修正</th>
            <th>技能</th>
            <th>修正</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="i in skillsTableRowCount" :key="i">
            <template v-for="j in 4" :key="`${i}-${j}`">
              <template v-if="!getSkillCell(i, j)">
                <td></td><td></td>
              </template>
              <template v-else-if="getPropCell(i, j).prop">
                <td colspan="2"><button class="btn btn-xs btn-ghost font-medium text-gray-400">{{ getPropCell(i, j).prop + '系' }}</button></td>
              </template>
              <template v-else>
                <td :class="{ highlight: !!cardData.meta.experienced[getSkillCell(i, j).skill] }">
                  <button class="btn btn-xs btn-ghost font-medium" @click="toggleSkillGrowth(getSkillCell(i, j).skill)">{{ getSkillCell(i, j).skill }}</button>
                </td>
                <td :class="{ highlight: !!cardData.meta.experienced[getSkillCell(i, j).skill] }">
                  <number-input v-model="cardData.skills[getSkillCell(i, j).skill]" allow-negative class="input input-ghost input-xs text-sm w-14"/>
                  <span class="text-gray-400 text-xs">{{ skillTotalOf(getSkillCell(i, j).skill) }}</span>
                </td>
              </template>
            </template>
          </tr>
          </tbody>
        </table>
        <div class="mt-4 flex gap-2 items-start">
          <div style="flex: 3 1 0">
            <!-- 物品 -->
            <table class="table table-compact table-zebra w-full">
              <thead>
              <tr>
                <th colspan="2">物品</th>
                <th colspan="2">物品</th>
                <th colspan="2">物品</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(sublist, i) in items" :key="i">
                <template v-for="(item, j) in sublist">
                  <template v-if="item">
                    <td :key="`name-${j}`"><button class="btn btn-xs btn-ghost font-medium">{{ item }}</button></td>
                    <td :key="`value-${j}`" class="flex items-center justify-between group">
                      <number-input v-model="cardData.items[item]" allow-negative class="input input-ghost input-xs text-sm w-20"/>
                      <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteItem(item)">
                        <XMarkIcon class="w-4 h-4" />
                      </button>
                    </td>
                  </template>
                </template>
              </tr>
              </tbody>
            </table>
            <!-- 武器 -->
            <table class="table table-compact table-zebra w-full mt-4">
              <thead>
              <tr>
                <th class="w-1/4">装备/武器</th>
                <th class="w-1/4">表达式</th>
                <th>备注</th>
                <th class="w-8"></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(ability, i) in cardData.equips" :key="i" class="group">
                <td><text-input v-model="ability.name" class="input input-ghost input-xs w-full"/></td>
                <td><text-input v-model="ability.expression" class="input input-ghost input-xs w-full"/></td>
                <td><text-input v-model="ability.ext" class="input input-ghost input-xs w-full"/></td>
                <td style="padding: 0">
                  <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteAbility('equips', i)">
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr>
                <td colspan="4"><button class="btn btn-xs btn-ghost" @click="newAbility('equips')">+ 新增一行</button></td>
              </tr>
              </tbody>
            </table>
            <!-- 法术 -->
            <table class="table table-compact table-zebra w-full mt-4">
              <thead>
              <tr>
                <th class="w-1/4">法术</th>
                <th class="w-1/4">表达式</th>
                <th>备注</th>
                <th colspan="2" class="w-16 px-0">数据库</th>
<!--                <th class="w-8"></th>-->
              </tr>
              </thead>
              <tbody>
              <tr v-for="(ability, i) in cardData.spells" :key="i" class="group">
                <td><text-input v-model="ability.name" class="input input-ghost input-xs w-full"/></td>
                <td><text-input v-model="ability.expression" class="input input-ghost input-xs w-full"/></td>
                <td><text-input v-model="ability.ext" class="input input-ghost input-xs w-full"/></td>
                <td>
                  <button class="btn btn-xs btn-circle btn-ghost" @click="openSpellData(ability.name)">
                    <InformationCircleIcon class="w-4 h-4" />
                  </button>
                </td>
                <td style="padding: 0">
                  <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteAbility('spells', i)">
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr>
                <td colspan="4"><button class="btn btn-xs btn-ghost" @click="newAbility('spells')">+ 新增一行</button></td>
              </tr>
              </tbody>
            </table>
          </div>
          <table class="table table-compact table-zebra w-36 flex-none">
            <thead>
            <tr><th>法术位</th></tr>
            </thead>
            <tbody>
            <tr v-for="i in 9" :key="i">
              <td>
                <button class="btn btn-xs btn-ghost font-medium mr-4">{{ i }}</button>
                <number-input v-model="cardData.meta.spellSlots[i].value" class="input input-ghost input-xs text-sm w-12"/>/
                <number-input v-model="cardData.meta.spellSlots[i].max" class="input input-ghost input-xs text-sm w-12"/>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <!-- 职业能力 -->
        <table class="table table-compact table-zebra w-full mt-4">
          <thead>
          <tr>
            <th class="w-1/4">职业能力</th>
            <th class="w-14">LV</th>
            <th>描述</th>
            <th class="w-8 p-0">
              <button class="btn btn-xs btn-circle btn-ghost" @click="foldPanel.jobAbilities = !foldPanel.jobAbilities">
                <component :is="foldPanel.jobAbilities ? ChevronDownIcon : ChevronUpIcon" class="w-4 h-4" />
              </button>
            </th>
          </tr>
          </thead>
          <tbody v-show="!foldPanel.jobAbilities">
          <tr v-for="(line, i) in cardData.jobAbilities" :key="i" class="group">
            <td><text-input v-model="line.name" class="input input-ghost input-xs w-full"/></td>
            <td><number-input v-model="line.lv" class="input input-ghost input-xs text-sm w-14"/></td>
            <td><textarea v-model="line.desc" class="textarea textarea-xs w-full min-h-[1.75rem] bg-transparent" @change="markEdited" /></td>
            <td style="padding: 0">
              <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteAbility('jobAbilities', i)">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr>
            <td colspan="4"><button class="btn btn-xs btn-ghost" @click="newAbility('jobAbilities')">+ 新增一行</button></td>
          </tr>
          </tbody>
        </table>
        <!-- 专长 -->
        <table class="table table-compact table-zebra w-full mt-4">
          <thead>
          <tr>
            <th class="w-1/4">专长</th>
            <th class="w-14">LV</th>
            <th>描述</th>
            <th class="w-8 p-0">
              <button class="btn btn-xs btn-circle btn-ghost" @click="foldPanel.specialists = !foldPanel.specialists">
                <component :is="foldPanel.specialists ? ChevronDownIcon : ChevronUpIcon" class="w-4 h-4" />
              </button>
            </th>
          </tr>
          </thead>
          <tbody v-show="!foldPanel.specialists">
          <tr v-for="(line, i) in cardData.specialists" :key="i" class="group">
            <td><text-input v-model="line.name" class="input input-ghost input-xs w-full"/></td>
            <td><number-input v-model="line.lv" class="input input-ghost input-xs text-sm w-14"/></td>
            <td><textarea v-model="line.desc" class="textarea textarea-xs w-full min-h-[1.75rem] bg-transparent" @change="markEdited" /></td>
            <td style="padding: 0">
              <button class="btn btn-xs btn-circle btn-ghost invisible group-hover:visible" @click="deleteAbility('specialists', i)">
                <XMarkIcon class="w-4 h-4" />
              </button>
            </td>
          </tr>
          <tr>
            <td colspan="4"><button class="btn btn-xs btn-ghost" @click="newAbility('specialists')">+ 新增一行</button></td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- 法术数据库 -->
    <DndSpellsDataDialog v-model:visible="spellDialogShow" v-model:keyword="spellDialogKeyword" />
  </div>
</template>
<script setup lang="ts">
import { useCardStore } from '../../../store/card'
import { computed, ComputedRef, inject, reactive, ref } from 'vue'
import { XMarkIcon, InformationCircleIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { SELECTED_CARD } from '../utils'
import { DndCard, getSkillsMap, IDndCardData } from '../../../../interface/card/dnd'
import CardToolbar from '../CardToolbar.vue'
import TextInput from '../TextInput.vue'
import NumberInput from '../NumberInput.vue'
import DndSpellsDataDialog from '../DndSpellsDataDialog.vue'

const cardStore = useCardStore()
const dndCard = inject<ComputedRef<DndCard>>(SELECTED_CARD)! // 此处可以确保是 dnd card
const cardData = computed(() => dndCard.value.data)

// 属性值计算
type PropType = keyof typeof cardData.value.props
const propKeys = computed(() => Object.keys(cardData.value.props) as Array<PropType>)
const modifiedValueOf = (prop: string) => dndCard.value.getEntry(prop + '调整')!.value
const savingValueOf = (prop: string) => dndCard.value.getEntry(prop + '豁免')!.value

// 技能表格
const skillsTable = (() => {
  const skillsMap = getSkillsMap()
  const col1 = [{ prop: '力量' as const }, skillsMap['力量'].map(skill => ({ skill })), { prop: '敏捷' as const }, skillsMap['敏捷'].map(skill => ({ skill }))].flat()
  const col2 = [{ prop: '智力' as const }, skillsMap['智力'].map(skill => ({ skill }))].flat()
  const col3 = [{ prop: '感知' as const }, skillsMap['感知'].map(skill => ({ skill }))].flat()
  const col4 = [{ prop: '魅力' as const }, skillsMap['魅力'].map(skill => ({ skill }))].flat()
  return [col1, col2, col3, col4]
})()
const skillsTableRowCount = Math.max(...skillsTable.map(col => col.length))
// getCell 时处理一些类型问题
const getPropCell = (row: number, col: number) => skillsTable[col - 1][row - 1] as { prop: keyof IDndCardData['props'] }
const getSkillCell = (row: number, col: number) => skillsTable[col - 1][row - 1] as { skill: keyof IDndCardData['skills'] }
const skillTotalOf = (skill: string) => dndCard.value.getEntry(skill)!.value

// 物品表格 分三栏
const items = computed(() => {
  const itemList = Object.keys(cardData.value.items)
  const length = Math.ceil(itemList.length / 3)
  return new Array(length).fill(0).map((_, i) => [itemList[i * 3], itemList[i * 3 + 1], itemList[i * 3 + 2]])
})

const deleteItem = (name: string) => {
  delete cardData.value.items[name]
  markEdited()
}

// 熟练度标记
const toggleSkillGrowth = (skill: string) => {
  const targetCard = dndCard.value
  const marked = !!targetCard.data.meta.experienced[skill]
  const updated = !marked ? targetCard.markExperienced(skill) : targetCard.cancelExperienced(skill)
  if (updated) {
    cardStore.markCardEdited(targetCard.name)
  }
}

// 新增一条 ability
const newAbility = (type: 'equips' | 'spells' | 'jobAbilities' | 'specialists') => {
  if (type === 'equips' || type === 'spells') {
    cardData.value[type].push({ name: '', expression: '', ext: '' })
  } else {
    cardData.value[type].push({ name: '', lv: 0, desc: '' })
  }
  // 不用标记编辑，因为单纯添加不后续编辑的话就相当于没有添加
}

// 删除一条 ability
const deleteAbility = (type: 'equips' | 'spells' | 'jobAbilities' | 'specialists', index: number) => {
  cardData.value[type].splice(index, 1)
  markEdited()
}

// 标记人物卡被编辑
const markEdited = () => {
  cardData.value.lastModified = Date.now()
  cardStore.markCardEdited(dndCard.value.name)
}

// 记录折叠状态
const foldPanel = reactive<Record<string, boolean>>({})

// 法术数据库
const spellDialogShow = ref(false)
const spellDialogKeyword = ref('')
const openSpellData = (name: string) => {
  spellDialogKeyword.value = name
  spellDialogShow.value = true
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

td.highlight,
tr.highlight td {
  background: hsl(var(--s)) !important;
}
</style>

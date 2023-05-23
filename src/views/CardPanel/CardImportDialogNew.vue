<template>
  <button class="btn modal-button btn-primary gap-2" @click="open = true">
    <PlusCircleIcon class="w-6 h-6"/>
    导入人物卡
  </button>
  <d-modal v-model:visible="open" title="导入人物卡">
    <div class="flex gap-2 items-center mb-4">
      <div>人物卡类型：</div>
      <div class="tabs tabs-boxed">
        <a class="tab" :class="{ 'tab-active': cardType === 'coc' }" @click="cardType = 'coc'">COC</a>
        <a class="tab" :class="{ 'tab-active': cardType === 'dnd' }" @click="cardType = 'dnd'">DND</a>
        <a class="tab" :class="{ 'tab-active': cardType === 'general' }" @click="cardType = 'general'">简单人物卡</a>
      </div>
    </div>
    <div class="flex gap-2 items-center mb-4">
      <span class="flex-none">人物卡名称：</span>
      <input v-model.trim="cardName" type="text" placeholder="名称将作为人物卡的唯一标识"
             class="input input-bordered input-sm w-full" :class="{ 'input-error': !cardName }"/>
    </div>
    <label class="label cursor-pointer justify-start gap-2">
      <input type="radio" class="radio radio-primary" :checked="importType === 'text'" @click="importType = 'text'" />文本导入
    </label>
    <div class="mt-2 ml-8">
      <textarea v-model="textareaContent" class="textarea textarea-bordered w-full h-30" :disabled="importType !== 'text'"
                placeholder="请输入属性列表，例如：力量37体质60体格65敏捷73外貌75妙手10侦查25潜行20 …… 留空即代表空白人物卡"/>
    </div>
    <template v-if="cardType !== 'general'">
      <label class="label cursor-pointer justify-start gap-2">
        <input type="radio" class="radio radio-primary" :checked="importType === 'excel'" @click="importType = 'excel'" />Excel 导入
      </label>
      <div class="mt-2 ml-8">
        <input ref="fileChooser" type="file" class="file-input file-input-bordered file-input-primary w-full"
               accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :disabled="importType !== 'excel'" @change="handleFile" />
      </div>
      <div class="mt-2 ml-8">当前支持的人物卡模版：</div>
      <ul class="ml-8 list-disc list-inside">
        <template v-if="cardType === 'coc'">
          <li>COC七版人物卡v1.6.0 <a class="link" href="https://paotuan.github.io/static/cocv7.xlsx" target="_blank">点击下载</a></li>
          <li>COC7 CY22.3Plus <a class="link" href="https://congyu.lanzoui.com/b00nb3n2d" target="_blank">点击下载</a> (密码：29mb)</li>
        </template>
        <template v-else-if="cardType === 'dnd'">
          <li>5E半自动人物卡1.0.2（SAS）-by喵拜 <a class="link" href="https://www.xn--rss892n.top:8080/externalLinksController/chain/5E%E5%8D%8A%E8%87%AA%E5%8A%A8%E4%BA%BA%E7%89%A9%E5%8D%A11.0.2%EF%BC%88SAS%EF%BC%89-by%E5%96%B5%E6%8B%9C.xlsx?ckey=eq%2BqZcNqTnnyQDtOpi6%2FHtEjFyGdQGdCbBnzbMtN6WD6ixhekJSxK9Wlh%2FtK6Nq%2B" target="_blank">点击下载</a></li>
        </template>
      </ul>
    </template>
    <template v-if="cardType === 'coc'">
      <label class="label cursor-pointer justify-start gap-2 mt-2">
        <input v-model="cocApplyDefaultValue" type="checkbox" class="checkbox checkbox-primary" />
        <span>对于未录入的 COC 技能，自动补充默认值</span>
      </label>
    </template>
    <template #action>
      <div class="flex items-center gap-4">
        <div v-show="nameExist"
             class="text-sm bg-warning text-warning-content px-2 py-0.5 rounded flex items-center gap-0.5">
          <ExclamationCircleIcon class="w-4 h-4"/>
          存在同名人物卡，导入后将覆盖旧的人物卡
        </div>
        <button class="btn btn-primary" :disabled="!canSubmit" @click="submit">导入!</button>
      </div>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import { PlusCircleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { computed, ref, watch } from 'vue'
import DModal from '../../dui/modal/DModal.vue'
import type { CardType, ICard } from '../../../interface/card/types'
import { useCardStore } from '../../store/card'
import * as XLSX from 'xlsx'
import { getCocCardProto, parseCocXlsx } from '../../store/card/importer/coc'
import { Toast } from '../../utils'
import { createCard } from '../../../interface/card'
import { addAttributesBatch, getGeneralCardProto } from '../../store/card/importer/utils'
import { CocCard } from '../../../interface/card/coc'
import { getDndCardProto, parseDndXlsx } from '../../store/card/importer/dnd'

const open = ref(false)
const cardType = ref<CardType>('coc')
const cardName = ref('')
const importType = ref<'text' | 'excel'>('text')
const textareaContent = ref('')
const xlsxCard = ref<ICard | null>(null)
const fileChooser = ref<HTMLInputElement>()
const cocApplyDefaultValue = ref(true)

// 表单合法性校验
const canSubmit = computed(() => {
  if (!cardName.value.trim()) return false
  if (importType.value === 'excel' && !xlsxCard.value) return false
  return true
})

// 名字重复校验
const cardStore = useCardStore()
const nameExist = computed(() => cardStore.existNames.includes(cardName.value))

const clearFileInput = () => {
  xlsxCard.value = null
  fileChooser.value && (fileChooser.value.value = '')
}

// 切换 tab 处理
watch(cardType, value => {
  // general card 只支持文本导入
  if (value === 'general') {
    importType.value = 'text'
  }
  // 切换类型清空 excel
  clearFileInput()
})

// 导入并解析 excel
const handleFile = (e: Event) => {
  const parseType = cardType.value
  const files = (e.target as HTMLInputElement).files, f = files![0]
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      if (parseType === 'coc') {
        xlsxCard.value = parseCocXlsx(workbook)
      } else if (parseType === 'dnd') {
        xlsxCard.value = parseDndXlsx(workbook)
      } else {
        throw new Error('Cannot import xlsx when type=' + parseType)
      }
      // 自动带入人物卡的名字
      if (!cardName.value) {
        cardName.value = xlsxCard.value.name
      }
    } catch (e) {
      console.log(e)
      Toast.error('文件解析失败！')
    }
  }
  reader.readAsArrayBuffer(f)
}

// 根据类型创建人物卡模板
const getCardProto = () => {
  const name = cardName.value.trim()
  if (cardType.value === 'coc') {
    return getCocCardProto(name)
  } else if (cardType.value === 'dnd') {
    return getDndCardProto(name)
  } else {
    return getGeneralCardProto(name)
  }
}

const submit = () => {
  if (!cardName.value.trim()) return // 必须设置名字
  let card: ICard
  if (importType.value === 'text') { // 导入 text
    card = createCard(getCardProto())
    addAttributesBatch(card, textareaContent.value)
  } else { // 导入 excel
    if (!xlsxCard.value) return
    card = xlsxCard.value
    card.data.name = cardName.value // name 使用界面上的值，允许和 excel 不同
  }
  // coc 设置技能默认值
  if (card instanceof CocCard && cocApplyDefaultValue.value) {
    card.applyDefaultValues()
  }
  // 清空输入框
  cardName.value = ''
  textareaContent.value = ''
  clearFileInput()
  // 导入之
  cardStore.importCard(card.data)
  open.value = false
}
</script>

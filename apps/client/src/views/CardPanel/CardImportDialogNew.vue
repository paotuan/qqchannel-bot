<template>
  <button class="btn modal-button btn-primary" @click="open = true">
    <PlusCircleIcon class="size-6"/>
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
          <li>DND5E 半自动人物卡 太易&熊妈妈版 v1.81δ <a class="link" href="https://pocketbear.lanzouy.com/b013kunkd" target="_blank">点击下载</a> (密码：tybr)</li>
        </template>
      </ul>
    </template>
    <div class="divider m-0" />
    <div class="flex gap-2 items-center my-2">
      <span class="flex-none">基于已有模板补充默认值？</span>
      <select v-model="useTemplate" class="select select-bordered select-sm w-full max-w-xs">
        <option v-for="opt in existTemplateOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>
    <label class="label cursor-pointer justify-start gap-2">
      <input v-model="importAsTemplate" type="checkbox" class="checkbox checkbox-primary" />
      <span>导入为人物卡模板</span>
    </label>
    <template #action>
      <div class="flex items-center gap-4">
        <div v-show="nameExist"
             class="text-sm bg-warning text-warning-content px-2 py-0.5 rounded flex items-center gap-0.5">
          <ExclamationCircleIcon class="size-4"/>
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
import { createCard, CocCard, type CardType, DndCard, CardProto } from '@paotuan/card'
import { useCardStore } from '../../store/card'
import * as XLSX from 'xlsx'
import { parseCocXlsx, parseCocXlsxName } from '../../store/card/importer/coc'
import { Toast } from '../../utils'
import { addAttributesBatch } from '../../store/card/importer/utils'
import { parseDndXlsx, parseDndXlsxName } from '../../store/card/importer/dnd'
import { cloneDeep } from 'lodash'

const open = ref(false)
const cardType = ref<CardType>('coc')
const cardName = ref('')
const importType = ref<'text' | 'excel'>('text')
const textareaContent = ref('')
const xlsxWorkbook = ref<XLSX.WorkBook | null>(null)
const fileChooser = ref<HTMLInputElement>()
const importAsTemplate = ref(false)

// 表单合法性校验
const canSubmit = computed(() => {
  if (!cardName.value.trim()) return false
  if (importType.value === 'excel' && !xlsxWorkbook.value) return false
  return true
})

// 名字重复校验
const cardStore = useCardStore()
const nameExist = computed(() => cardStore.existNames.includes(cardName.value))

const clearFileInput = () => {
  xlsxWorkbook.value = null
  fileChooser.value && (fileChooser.value.value = '')
}

// 已有模板选择
const useTemplate = ref('')
const existTemplateOptions = computed(() => [
  { label: '无', value: '' },
  ...cardStore.templateCardList.filter(template => template.type === cardType.value).map(template => ({ label: template.name, value: template.name })),
])

// 切换 tab 处理
watch(cardType, value => {
  // general card 只支持文本导入
  if (value === 'general') {
    importType.value = 'text'
  }
  // 切换类型清空 excel
  clearFileInput()
  // 切换类型重置模板选择 todo 记忆
  useTemplate.value = ''
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
      xlsxWorkbook.value = workbook
      // 自动带入人物卡的名字
      if (!cardName.value) {
        cardName.value = (() => {
          if (parseType === 'coc') {
            return parseCocXlsxName(workbook)
          } else if (parseType === 'dnd') {
            return parseDndXlsxName(workbook)
          } else {
            return ''
          }
        })()
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
  const template = useTemplate.value
  const proto = cardStore.of(template) ?? CardProto[cardType.value] // 如有 template，优先根据 template 创建。否则初始化各类型的空白卡
  const newCardData = cloneDeep(proto)
  newCardData.created = newCardData.lastModified = Date.now()
  return newCardData
}

const submit = () => {
  if (!cardName.value.trim()) return // 必须设置名字
  const card = createCard(getCardProto())
  if (importType.value === 'text') { // 导入 text
    addAttributesBatch(card, textareaContent.value)
  } else if (xlsxWorkbook.value) { // 导入 excel
    if (card.type === 'coc') {
      parseCocXlsx(card as CocCard, xlsxWorkbook.value)
    } else if (card.type === 'dnd') {
      parseDndXlsx(card as DndCard, xlsxWorkbook.value)
    }
  }
  card.data.name = cardName.value.trim() // name 使用界面上的值，允许和 excel 不同
  // 是否是模板导入
  card.data.isTemplate = importAsTemplate.value
  // 若不是模板，则初始化可能有的字段表达式
  if (!card.data.isTemplate) {
    card.initByTemplate()
  }
  // 清空输入框
  cardName.value = ''
  textareaContent.value = ''
  importAsTemplate.value = false
  clearFileInput()
  // 导入之
  cardStore.importCard(card.data)
  open.value = false
}
</script>

<template>
  <!-- The button to open modal -->
  <label for="my-modal-3" class="btn modal-button btn-primary gap-2">
    <PlusCircleIcon class="w-6 h-6"/>
    导入人物卡
  </label>

  <!-- Put this part before </body> tag -->
  <input type="checkbox" id="my-modal-3" class="modal-toggle"/>
  <label for="my-modal-3" class="modal cursor-pointer">
    <label class="modal-box relative" for="">
      <label ref="closeBtn" for="my-modal-3" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</label>
      <h3 class="text-lg font-bold flex gap-2">
        <DocumentTextIcon class="w-6 h-6"/>
        导入人物卡
      </h3>
      <div class="tabs mt-4">
        <a class="tab tab-bordered" :class="{ 'tab-active': tab === 'text' }" @click="tab = 'text'">文本导入</a>
        <a class="tab tab-bordered" :class="{ 'tab-active': tab === 'excel' }" @click="tab = 'excel'">Excel 导入</a>
      </div>
      <!-- 文本导入 -->
      <div v-if="tab === 'text'" class="mt-4">
        <div class="flex gap-2 items-center">
          <span class="flex-none">人物名称：</span>
          <input v-model="textName" type="text" placeholder="请输入人物名称"
                 class="input input-bordered input-sm w-full" :class="{ 'input-error': !textName }"/>
        </div>
        <textarea v-model="textareaContent" class="mt-4 textarea textarea-bordered w-full h-60"
                  placeholder="请输入属性列表，例如：力量37体质60体格65敏捷73外貌75妙手10侦查25潜行20 ……"/>
      </div>
      <!-- excel 导入 -->
      <div v-if="tab === 'excel'" class="mt-4">
        <input ref="fileChooser" type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
               @change="handleFile"/>
        <div class="mt-4">当前支持的人物卡模版：</div>
        <div>COC七版人物卡v1.6.0 <a class="link" href="https://paotuan.github.io/static/cocv7.xlsx" target="_blank">点击下载</a></div>
        <div>COC7 CY22.3Plus <a class="link" href="https://congyu.lanzoui.com/b00nb3n2d" target="_blank">点击下载</a> (密码：29mb)</div>
      </div>
      <!-- 提交 -->
      <div class="modal-action items-center">
        <div v-show="nameExist"
             class="text-sm bg-warning text-warning-content px-2 py-0.5 rounded flex items-center gap-0.5">
          <ExclamationCircleIcon class="w-4 h-4"/>
          存在同名人物卡，导入后将覆盖旧的人物卡
        </div>
        <button class="btn btn-primary" @click="submit">导入!</button>
      </div>
    </label>
  </label>
</template>
<script setup lang="ts">
import { PlusCircleIcon, DocumentTextIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'
import { parseCoCXlsx, parseText, useCardStore } from '../../store/card'
import type { ICard } from '../../../interface/common'
import { Toast } from '../../utils'

const tab = ref<'text' | 'excel'>('text')
const closeBtn = ref<HTMLElement>()
const closeModal = () => closeBtn.value?.click() // 这种 modal 没双向绑定还是蛋疼

const textName = ref('')
const textareaContent = ref('')
const xlsxCard = ref<ICard | null>(null)
const fileChooser = ref()

const cardStore = useCardStore()
const nameExist = computed(() => {
  if (tab.value === 'text') {
    return cardStore.existNames.includes(textName.value)
  } else if (tab.value === 'excel' && xlsxCard.value) {
    return cardStore.existNames.includes(xlsxCard.value.basic.name)
  } else {
    return false
  }
})

const submit = () => {
  if (tab.value === 'text') {
    if (!textName.value || !textareaContent.value) return
    const card = parseText(textName.value, textareaContent.value)
    cardStore.importCard(card)
    // manual close and clear
    closeModal()
    textName.value = ''
    textareaContent.value = ''
  } else if (tab.value === 'excel') {
    if (!xlsxCard.value) return
    cardStore.importCard(xlsxCard.value)
    closeModal()
    xlsxCard.value = null
    ;(fileChooser.value as HTMLInputElement).value = ''
  }
}

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files, f = files![0]
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      xlsxCard.value = parseCoCXlsx(workbook)
    } catch (e) {
      console.log(e)
      Toast.error('文件解析失败！')
    }
  }
  reader.readAsArrayBuffer(f)
}
</script>


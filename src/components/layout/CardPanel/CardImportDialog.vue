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
                  placeholder="请输入属性，使用冒号和空格分隔，冒号周围不要带空格。例如：力量:37 体质:60 体格:65 敏捷:73 外貌:75 妙手:10 侦查:25 潜行:20 ……"/>
      </div>
      <div class="modal-action items-center">
        <div v-show="nameExist" class="text-sm bg-warning text-warning-content px-2 py-0.5 rounded flex items-center gap-0.5">
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
import { useCardStore } from '../../../store/card'

const tab = ref<'text' | 'excel'>('text')
const closeBtn = ref<HTMLElement>()
const closeModal = () => closeBtn.value?.click() // 这种 modal 没双向绑定还是蛋疼

const textName = ref('')
const textareaContent = ref('')

const cardStore = useCardStore()
const nameExist = computed(() => {
  if (tab.value === 'text') {
    return cardStore.existNames.includes(textName.value)
  } else {
    return false
  }
})

const submit = () => {
  if (tab.value === 'text') {
    if (!textName.value) return
    cardStore.importText(textName.value, textareaContent.value)
    // manual close and clear
    closeModal()
    textName.value = ''
    textareaContent.value = ''
  }
}
</script>


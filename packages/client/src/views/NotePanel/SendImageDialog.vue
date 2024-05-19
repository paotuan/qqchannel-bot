<template>
  <button class="btn btn-secondary h-auto" @click="open = true">发送图片</button>
  <d-modal v-model:visible="open" title="发送图片笔记">
    <div class="py-2">请输入网络图片 URL:</div>
    <input v-model="noteStore.imageUrl" type="text" placeholder="输入网络图片 URL" class="input input-bordered input-sm w-full mb-4" />
    <div class="py-2">或上传本地图片：</div>
    <input :ref="el => noteStore.imageFileChooser = el as HTMLInputElement" type="file" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" @change="handleFile"/>
    <template #action>
      <button class="btn" @click="open = false">取消</button>
      <button class="btn btn-primary" :disabled="submitDisabled" @click="submit">确定</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { computed } from 'vue'
import { useNoteStore } from '../../store/note'

const noteStore = useNoteStore()
const open = computed({
  get: () => noteStore.imageDialogVisible,
  set: (val) => noteStore.imageDialogVisible = val
})

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  noteStore.imageFile = files![0]
}

const submitDisabled = computed(() => !noteStore.imageUrl.trim() && !noteStore.imageFile)

const submit = () => {
  noteStore.sendImage()
}
</script>

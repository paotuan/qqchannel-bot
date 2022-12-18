<template>
  <button class="btn btn-secondary h-auto" @click="open = true">发送图片</button>
  <d-modal v-model:visible="open" title="发送图片笔记">
    <div class="py-2">请输入网络图片 URL:</div>
    <input v-model="netImageUrl" type="text" placeholder="输入网络图片 URL" class="input input-bordered input-sm w-full mb-4" />
    <div class="py-2">或上传本地图片：</div>
    <input ref="fileChooser" type="file" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" @change="handleFile"/>
    <template #action>
      <button class="btn btn-accent" @click="open = false">取消</button>
      <button class="btn btn-primary" :disabled="submitDisabled" @click="submit">确定</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { computed, ref } from 'vue'
import ws from '../../api/ws'

const open = ref(false)
const netImageUrl = ref('')
const file = ref<File>()
const fileChooser = ref()

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  file.value = files![0]
  console.log(file.value)
}

const submitDisabled = computed(() => !netImageUrl.value.trim() && !file.value)

const submit = async () => {
  // test send local
  ws.sendRaw(file.value!)
}
</script>

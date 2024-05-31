<template>
  <label class="label cursor-pointer p-2 rounded-xl border border-primary border-dashed" @click="open = true">
    <span class="inline-flex items-center gap-2">
      <PlusCircleIcon class="size-4 text-primary" />
      <span class="label-text">新建子频道</span>
    </span>
  </label>
  <d-modal v-model:visible="open" title="新建子频道">
    <input v-model="name" type="text" placeholder="请输入子频道名称" class="input input-bordered w-full max-w-xs" />
    <template #action>
      <button class="btn" @click="open = false">取消</button>
      <button class="btn btn-primary" :disabled="!name" @click="submit">
        <span v-if="loading" class="loading loading-spinner" />确定
      </button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import type { IChannelCreateReq } from '@paotuan/types'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import DModal from '../../dui/modal/DModal.vue'
import { ref } from 'vue'
import ws from '../../api/ws'
import { gtagEvent, Toast } from '../../utils'

const props = defineProps<{ guildId: string }>()
const open = ref(false)
const name = ref('')

const loading = ref(false)
const submit = () => {
  if (!name.value) return
  if (loading.value) return
  loading.value = true
  ws.send<IChannelCreateReq>({ cmd: 'channel/create', data: { guildId: props.guildId, name: name.value } })
  ws.once('channel/create', data => {
    loading.value = false
    open.value = false
    Toast[data.success ? 'success' : 'error'](data.data as string)
  })
  gtagEvent('channel/create')
}
</script>

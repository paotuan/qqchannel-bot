<template>
  <d-modal :visible="!!props.mode" :title="title" lock @update:visible="close">
    <div class="flex items-center gap-1 text-sm text-base-content/60 mb-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 size-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>名称和功能描述只用于展示，不影响实际功能</span>
    </div>
    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">请输入名称</span>
      </label>
      <input v-model="form.name" type="text" placeholder="请输入名称" class="input input-bordered w-full" :class="{ 'input-error': nameHasError }" />
    </div>
    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">请输入功能描述</span>
      </label>
      <input v-model="form.desc" type="text" placeholder="请输入功能描述" class="input input-bordered w-full" />
    </div>
    <template #action>
      <button class="btn btn-accent" @click="close">取消</button>
      <button class="btn btn-primary" @click="submit">确定</button>
    </template>
  </d-modal>
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { computed, reactive, ref, watch } from 'vue'

interface Props {
  mode?: 'add' | 'edit' | null
  module?: string
  defaultName?: string
  defaultDesc?: string
}

interface Emits {
  (e: 'update:mode', value: 'add' | 'edit' | null): void
  (e: 'submit', value: { name: string, desc: string }): void
}

const props = withDefaults(defineProps<Props>(), { defaultName: '', defaultDesc: '', module: '' })
const emit = defineEmits<Emits>()

const title = computed(() => (props.mode === 'add' ? '新增' : '编辑') + props.module)
const form = reactive({ name: '', desc: '' })
watch(
  props,
  () => {
    form.name = props.defaultName
    form.desc = props.defaultDesc
  },
  { immediate: true }
)
const nameHasError = ref(false)
const close = () => emit('update:mode', null)
const submit = () => {
  if (!form.name.trim()) {
    nameHasError.value = true
    return
  }
  emit('submit', { name: form.name.trim(), desc: form.desc.trim() })
  close()
}
</script>

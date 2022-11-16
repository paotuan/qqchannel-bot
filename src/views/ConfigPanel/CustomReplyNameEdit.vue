<template>
  <d-modal :visible="!!props.mode" :title="title" lock @update:visible="close">
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
  defaultName?: string
  defaultDesc?: string
}

interface Emits {
  (e: 'update:mode', value: 'add' | 'edit' | null): void
  (e: 'submit', value: { name: string, desc: string }): void
}

const props = withDefaults(defineProps<Props>(), { defaultName: '', defaultDesc: '' })
const emit = defineEmits<Emits>()

const title = computed(() => props.mode === 'add' ? '新增自定义回复' : '编辑自定义回复')
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

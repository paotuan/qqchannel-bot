<template>
  <div class="dropdown">
    <label tabindex="0">
      <template v-if="editMode">
        <input v-model="keyword" type="text" :placeholder="placeholder" class="input input-bordered w-52" @blur="editMode = false" />
      </template>
      <template v-else>
        <div class="select select-bordered items-center w-52 gap-2 truncate" @click="editMode = true">
          <span v-if="currentOptionLabel">{{ currentOptionLabel }}</span>
          <span v-else class="text-[#9ca3af]">{{ placeholder }}</span>
        </div>
      </template>
    </label>
    <ul tabindex="0" class="dropdown-content menu menu-compact p-2 shadow bg-base-100 rounded-box w-52 max-h-60 -ml-1 mt-2 overflow-y-auto flex-nowrap">
      <li v-for="option in optionsAfterSearch" :key="option.value"><a @click="select(option.value)">{{ option.label }}</a></li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  modelValue?: string
  placeholder?: string
  options?: { label: string, value: string }[]
}

const props = withDefaults(defineProps<Props>(), { placeholder: '搜索', options: () => [] })
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
// const onChange = (event: any) => emit('update:modelValue', event.target.value)

// 搜索相关
const editMode = ref(false)
const keyword = ref('')
const optionsAfterSearch = computed(() => {
  const kw = keyword.value.toLowerCase()
  return props.options.filter(option => option.label.toLowerCase().includes(kw)).slice(0, 100) // 默认展示 100 条
})

const currentOptionLabel = computed(() => props.options.find(option => option.value === props.modelValue)?.label ?? props.modelValue)
const select = (value: string) => {
  // 手动关闭 menu
  // https://www.reddit.com/r/tailwindcss/comments/rm0rpu/tailwind_and_daisyui_how_to_fix_the_issue_with/
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
  keyword.value = ''
  emit('update:modelValue', value)
}
</script>

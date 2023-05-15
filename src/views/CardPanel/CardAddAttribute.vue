<template>
  <span>
    <button class="btn btn-xs btn-secondary" @click="open = true">{{ props.dnd ? '添加物品' : '添加技能' }}</button>
    <d-modal v-model:visible="open" title="添加人物卡技能/属性/物品">
        <textarea v-model="textareaContent" class="mt-4 textarea textarea-bordered w-full h-60"
                  placeholder="请输入待录入列表，例如：力量37体质60体格65敏捷73外貌75妙手10侦查25潜行20 ……"/>
      <template #action>
        <button class="btn btn-accent" @click="open = false">取消</button>
        <button class="btn btn-primary" @click="submit">确定</button>
      </template>
    </d-modal>
  </span>
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { ref } from 'vue'

const props = defineProps<{ dnd?: boolean }>()
const emit = defineEmits<{ (e: 'submit', value: string): void }>()

const open = ref(false)
const textareaContent = ref('')
const submit = () => {
  open.value = false
  emit('submit', textareaContent.value.trim())
  textareaContent.value = ''
}
</script>

<template>
  <div class="absolute top-0 left-0 z-10 flex">
    <div class="tabs tabs-lifted flex-none -translate-x-full -translate-y-full origin-bottom-right -rotate-90">
      <a class="tab" :class="{ 'tab-active': modelValue === 'layer' }" @click="$emit('update:modelValue', 'layer')">
        <span>理</span>
        <span>管</span>
        <span>层</span>
        <span>图</span>
      </a>
      <a class="tab" :class="{ 'tab-active': modelValue === 'battle' }" @click="$emit('update:modelValue', 'battle')">
        <span>板</span>
        <span>面</span>
        <span>斗</span>
        <span>战</span>
      </a>
    </div>
  </div>
</template>
<script setup lang="ts">
// transform -translate-x-full -translate-y-full origin-bottom-right -rotate-90
const props = defineProps<{ modelValue: 'battle' | 'layer' }>()
const emit = defineEmits<{ (e: 'update:modelValue', tab: 'battle' | 'layer'): void }>()
</script>
<style scoped>
.tab span {
  @apply rotate-90;
}
</style>

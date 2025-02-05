<script setup lang="ts">
// 对于原本是 number 的字段，如果是 template，则可以编辑它的表达式
import { useCurrentSelectedCard } from '../utils'
import { computed } from 'vue'
import { get, set } from 'lodash'
import NumberInput from './NumberInput.vue'
import TextInput from './TextInput.vue'

const props = defineProps<{ path: string }>() // e.g. `basic.LUCK`

const selectedCard = useCurrentSelectedCard()!
const isTemplate = computed(() => selectedCard.value.isTemplate)

// 非 template 情况，直接向对应字段赋值
const vm = computed({
  get: () => get(selectedCard.value, props.path),
  set: (value: number) => set(selectedCard.value, props.path, value)
})

// template 情况，根据用户输入值判断
const templateVm = computed({
  // 优先读取 templateData
  get: () => selectedCard.value.data.templateData[props.path] ?? String(vm.value),
  set: (value: string) => {
    // 如果是数字，直接赋值，如果是表达式，则赋值 templateData，避免 templateData 过于臃肿
    if (isNumeric(value)) {
      vm.value = Number(value)
      delete selectedCard.value.data.templateData[props.path]
    } else {
      selectedCard.value.data.templateData[props.path] = ''
    }
  }
})

function isNumeric(value: string) {
  return /^-?\d+$/.test(value)
}
</script>
<template>
  <number-input v-if="!isTemplate" v-model="vm" v-bind="$attrs" />
  <text-input v-else v-model="templateVm" v-bind="$attrs" />
</template>

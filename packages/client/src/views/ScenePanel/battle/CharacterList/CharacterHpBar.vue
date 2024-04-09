<template>
  <div
    v-if="hasHpBar"
    class="absolute bottom-0 w-full h-2 border border-black bg-base-100"
    :title="`${props.hp}/${props.maxHp}`"
    style="justify-content: start"
  >
    <div class="h-full" :class="hpColor" :style="`width: ${hpPercentage}%`" />
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  hp?: number
  maxHp?: number
}

const props = withDefaults(defineProps<Props>(), { hp: NaN, maxHp: NaN })

const hasHpBar = computed(() => !isNaN(props.hp) && !isNaN(props.maxHp) && props.maxHp > 0)
const hpPercentage = computed(() => props.hp * 100 / props.maxHp)
const hpColor = computed(() => {
  if (props.hp <= props.maxHp / 5) {
    return 'bg-red-500'
  } else if (props.hp <= props.maxHp / 2) {
    return 'bg-yellow-500'
  } else {
    return 'bg-green-500'
  }
})
</script>

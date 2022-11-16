<template>
  <span>
    <input :checked="props.visible" type="checkbox" class="modal-toggle" @change="closeModal" />
    <div class="modal" @click="closeModal">
      <div class="modal-box" @click.stop>
        <h3 v-if="props.title" class="font-bold text-lg">{{ props.title }}</h3>
        <div class="py-4">
          <slot></slot>
        </div>
        <div class="modal-action">
          <slot name="action"></slot>
        </div>
      </div>
    </div>
  </span>
</template>
<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  lock?: boolean
}

const props = withDefaults(defineProps<Props>(), { lock: false })
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const closeModal = () => {
  if (!props.lock) {
    emit('update:visible', false)
  }
}
</script>


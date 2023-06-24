<template>
  <span>
    <input :checked="props.visible" type="checkbox" class="modal-toggle" @change="closeModal" />
    <div class="modal" @click="clickOutside">
      <div class="modal-box relative" :class="modalClass" @click.stop>
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
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
  modalClass?: string
}

const props = withDefaults(defineProps<Props>(), { lock: false, modalClass: '' })
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const clickOutside = () => {
  if (!props.lock) {
    closeModal()
  }
}

const closeModal = () => emit('update:visible', false)
</script>


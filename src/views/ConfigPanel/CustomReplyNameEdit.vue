<template>
  <d-modal v-model:visible="visible" />
</template>
<script setup lang="ts">
import DModal from '../../dui/modal/DModal.vue'
import { ref } from 'vue'

const visible = ref(false)
</script>

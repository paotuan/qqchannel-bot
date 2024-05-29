<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-circle btn-ghost btn-sm m-1"><SwatchIcon class="size-6" /></label>
    <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-28 max-h-80 overflow-y-auto flex-nowrap">
      <li v-for="theme in themes" :key="theme"><a :class="{ active: ui.theme === theme }" @click="select(theme)">{{ theme }}</a></li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { useUIStore } from '../../store/ui'
import { SwatchIcon } from '@heroicons/vue/24/outline'

const themes = ['light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset']
const ui = useUIStore()

const select = (theme: string) => {
  ui.setTheme(theme)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  document.activeElement?.blur?.()
}
</script>
<style scoped>
.dropdown-content::-webkit-scrollbar {
  display: none;
}
</style>

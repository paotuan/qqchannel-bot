<template>
  <div class="flex gap-2 justify-between">
    <VueDatePicker
        v-model="sceneStore.timeIndicator"
        locale="zh"
        format="yyyy/MM/dd HH:mm:ss"
        enable-seconds
        time-picker-inline
        week-start="0"
        :day-names="['日', '一', '二', '三', '四', '五', '六']"
        auto-apply
        :close-on-auto-apply="false"
    />
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-sm btn-square btn-outline border-base-300">
        <ChevronDoubleRightIcon class="size-4" />
      </label>
      <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-24">
        <li><a @click="addTime(6)">+ 6s</a></li>
        <li><a @click="addTime(60)">+ 1m</a></li>
        <li><a @click="addTime(30 * 60)">+ 30m</a></li>
        <li><a @click="addTime(60 * 60)">+ 1h</a></li>
        <li><a @click="addTime(12 * 60 * 60)">+ 12h</a></li>
        <li><a @click="addTime(24 * 60 * 60)">+ 24h</a></li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { ChevronDoubleRightIcon } from '@heroicons/vue/24/outline'
import { useSceneStore } from '../../../store/scene'

const sceneStore = useSceneStore()

const addTime = (timeS: number) => {
  const newTime = sceneStore.timeIndicator.getTime() + timeS * 1000
  sceneStore.timeIndicator = new Date(newTime)
}
</script>
<style>
.dp__theme_light {
  --tw-border-opacity: .2;
  --dp-background-color: oklch(var(--b1));
  --dp-text-color: oklch(var(--bc));
  /*--dp-hover-color: #f3f3f3;*/
  --dp-hover-text-color: oklch(var(--bc));
  /*--dp-hover-icon-color: #959595;*/
  --dp-primary-color: oklch(var(--p));
  --dp-primary-text-color: oklch(var(--pc));
  --dp-secondary-color: oklch(var(--s));
  --dp-border-color: oklch(var(--bc) / var(--tw-border-opacity));
  --dp-menu-border-color: oklch(var(--bc) / var(--tw-border-opacity));
  --dp-border-color-hover: oklch(var(--bc) / var(--tw-border-opacity));
  /*--dp-disabled-color: #f6f6f6;*/
  /*--dp-scroll-bar-background: #f3f3f3;*/
  /*--dp-scroll-bar-color: #959595;*/
  /*--dp-success-color: #76d275;*/
  /*--dp-success-color-disabled: #a3d9b1;*/
  /*--dp-icon-color: #959595;*/
  /*--dp-danger-color: #ff6f60;*/
  /*--dp-highlight-color: rgba(25, 118, 210, 0.1);*/
  --dp-border-radius: var(--rounded-btn, .5rem);
  --dp-cell-border-radius: var(--rounded-btn, .5rem);
}

.dp__input {
  height: 2rem;
}
</style>

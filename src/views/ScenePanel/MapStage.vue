<template>
  <div class="flex-grow py-4">
<!--    <input type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" @change="handleFile" />-->
    <div ref="container" class="w-full h-full"></div>
    <!-- toolbar -->
    <div class="fixed bottom-0 mx-auto">
      <div>
        <MapTool v-show="toolbarItem === 'map'" :layer="backgroundLayer" />
        <TokenTool v-show="toolbarItem === 'token'" :layer="contentLayer" />
      </div>
      <div class="flex gap-4">
        <button class="btn btn-square" :class="{ 'btn-outline': toolbarItem !== 'map' }" @click="selectToolbar('map')">
          <MapIcon class="h-6 w-6" />
        </button>
        <button class="btn btn-square" :class="{ 'btn-outline': toolbarItem !== 'token' }" @click="selectToolbar('token')">
          <MapPinIcon class="h-6 w-6" />
        </button>
        <button class="btn btn-square" :class="{ 'btn-outline': toolbarItem !== 'text' }" @click="selectToolbar('text')">
          <PencilIcon class="h-6 w-6" />
        </button>
        <!-- todo save btn -->
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import Konva from 'konva'
import { MapIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'
import MapTool from './toolbar/MapTool.vue'
import TokenTool from './toolbar/TokenTool.vue'

// container elem
const container = ref<HTMLDivElement>()

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem) => toolbarItem.value = item === toolbarItem.value ? null : item

// init stage
const backgroundLayer = shallowRef(new Konva.Layer())
const contentLayer = shallowRef(new Konva.Layer())
onMounted(() => {
  const stage = new Konva.Stage({
    container: container.value!,
    draggable: true,
    width: container.value!.clientWidth,
    height: 500 // todo
  })
  stage.add(backgroundLayer.value)
  stage.add(contentLayer.value)
})
</script>


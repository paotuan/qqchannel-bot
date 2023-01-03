<template>
  <div class="flex-grow py-4">
    <input type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" @change="handleFile" />
    <div ref="container" class="w-full h-full"></div>
    <!-- toolbar -->
    <div>
      <div>

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
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import Konva from 'konva'
import { MapIcon, MapPinIcon, PencilIcon } from '@heroicons/vue/24/outline'

// container elem
const container = ref<HTMLDivElement>()

// 当前选中的 toolbar item
type ToolbarItem = 'map' | 'token' | 'text' | null
const toolbarItem = ref<ToolbarItem>(null)
const selectToolbar = (item: ToolbarItem) => toolbarItem.value = item === toolbarItem.value ? null : item

// init stage
const layer = shallowRef(new Konva.Layer())
const background = shallowRef() // Konva.Image
onMounted(() => {
  const stage = new Konva.Stage({
    container: container.value!,
    draggable: true,
    width: container.value!.clientWidth,
    height: 500 // todo
  })
  stage.add(layer.value)
  // const circle = new Konva.Circle({
  //   x: stage.width() / 2,
  //   y: stage.height() / 2,
  //   radius: 70,
  //   fill: 'red',
  //   stroke: 'black',
  //   strokeWidth: 4
  // })
  // layer.value.add(circle)
})

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  const reader = new FileReader()
  reader.onload = (e) => {
    const imageUrl = e.target!.result
    Konva.Image.fromURL(imageUrl, (node: Konva.Image) => {
      const attrs = {
        x: 0,
        y: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        // draggable: true
      }
      console.log(attrs)
      node.setAttrs(attrs)
      // node.setAttr('data-src', imageUrl)
      layer.value.removeChildren()
      layer.value.add(node)
      background.value = node
    })
  }
  reader.readAsDataURL(files![0])
}
</script>


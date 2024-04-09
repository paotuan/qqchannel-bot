<template>
  <div>
    <button class="btn btn-secondary" @click="dialogVisible = true">随机！</button>
    <iframe ref="iframeRef" :src="generatorUrl" class="fixed left-0 top-0" width="0" height="0" />
    <d-modal v-model:visible="dialogVisible" title="随机地图配置">
      <div class="grid grid-cols-3 gap-4">
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">地图形状</span>
          </label>
          <select v-model="mapConfig.dungeon_layout" class="select select-bordered select-sm">
            <option value="square">方形</option>
            <option value="box">环形</option>
            <option value="cross">十字</option>
            <option value="saltire">X形</option>
            <option value="hexagon">六边形</option>
            <option value="round">圆形</option>
          </select>
        </div>
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">地图大小</span>
          </label>
          <select v-model="mapConfig.dungeon_size" class="select select-bordered select-sm">
            <option value="dimin">极小</option>
            <option value="tiny">超小</option>
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
            <option value="huge">超大</option>
            <option value="gargant">巨大</option>
          </select>
        </div>
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">楼梯</span>
          </label>
          <select v-model="mapConfig.add_stairs" class="select select-bordered select-sm">
            <option value="no">无</option>
            <option value="yes">有</option>
            <option value="many">多个</option>
          </select>
        </div>
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">房间分布</span>
          </label>
          <select v-model="mapConfig.room_layout" class="select select-bordered select-sm">
            <option value="sparse">稀疏</option>
            <option value="scattered">中等</option>
            <option value="dense">密集</option>
          </select>
        </div>
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">房间大小</span>
          </label>
          <select v-model="mapConfig.room_size" class="select select-bordered select-sm">
            <option value="small">小</option>
            <option value="medium">中</option>
            <option value="large">大</option>
            <option value="huge">超大</option>
            <option value="gargant">巨大</option>
          </select>
        </div>
        <div />
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">走廊形状</span>
          </label>
          <select v-model="mapConfig.corridor_layout" class="select select-bordered select-sm">
            <option value="labyrinth">曲折</option>
            <option value="errant">中等</option>
            <option value="straight">平直</option>
          </select>
        </div>
        <div class="form-control w-36">
          <label class="label">
            <span class="label-text">断头路</span>
          </label>
          <select v-model="mapConfig.remove_deadends" class="select select-bordered select-sm">
            <option value="none">多</option>
            <option value="some">少</option>
            <option value="all">无</option>
          </select>
        </div>
      </div>
      <template #action>
        <button class="btn btn-accent" @click="dialogVisible = false">取消</button>
        <button class="btn btn-primary" @click="onGenerate">生成！</button>
      </template>
    </d-modal>
  </div>
</template>
<script setup lang="ts">
import generatorUrl from './dungeon.html?url'
import { reactive, ref } from 'vue'
import DModal from '../../../../dui/modal/DModal.vue'

const emit = defineEmits<{ (e: 'generate', value: string): void }>()
const iframeRef = ref<HTMLIFrameElement>()
const dialogVisible = ref(false)

const mapConfig = reactive({
  dungeon_layout: 'square',
  dungeon_size: 'medium',
  add_stairs: 'yes',
  room_layout: 'scattered',
  room_size: 'medium',
  corridor_layout: 'errant',
  remove_deadends: 'some'
})

const onGenerate = () => {
  const iframeDoc = iframeRef.value!.contentDocument!
  // update config
  Object.keys(mapConfig).forEach((key) => {
    const select = iframeDoc.getElementById(key) as HTMLInputElement
    select.value = mapConfig[key as keyof typeof mapConfig]
  })
  // generate
  const newNameBtn = iframeDoc.getElementById('new_name') as HTMLInputElement
  newNameBtn.click()
  dialogVisible.value = false
  setTimeout(() => {
    const canvas = iframeDoc.getElementById('map') as HTMLCanvasElement
    emit('generate', canvas.toDataURL())
  }, 200)
}
</script>

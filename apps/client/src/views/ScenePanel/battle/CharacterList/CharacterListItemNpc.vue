<template>
  <div class="flex gap-2 h-12">
    <div class="avatar" :class="{ 'placeholder': !props.chara.avatar }" @click.stop="uploadAvatar">
      <template v-if="props.chara.avatar">
        <div class="w-12 rounded-full">
          <img :src="props.chara.avatar" :alt="props.chara.id" referrerpolicy="no-referrer" />
        </div>
      </template>
      <template v-else>
        <div class="w-12 rounded-full bg-neutral text-neutral-content">
          <span>{{ props.chara.id.slice(0, 2) }}</span>
        </div>
      </template>
      <input ref="realUploadBtn" type="file" name="filename" accept="image/gif,image/jpeg,image/jpg,image/png,image/svg" class="hidden" @change="handleFile" />
      <!-- 血条 -->
      <CharacterHpBar v-if="npcCardnn" :hp="npcCardnn.HP" :max-hp="npcCardnn.MAXHP" />
    </div>
    <div class="flex flex-col justify-between">
      <div class="font-bold max-w-[7rem] truncate">{{ props.chara.id }}</div>
      <span class="flex gap-1">
        <button class="btn btn-xs btn-outline btn-circle" @click.stop="showNpcCard">
          <DocumentTextIcon class="size-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle" :disabled="!sceneStore.hasCurrentMap" @click.stop="addCharacterToken">
          <MapPinIcon class="size-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle" @click.stop="sceneStore.duplicateNpc(props.chara)">
          <Square2StackIcon class="size-4" />
        </button>
        <button class="btn btn-xs btn-outline btn-circle btn-error" @click.stop="deleteCharacter" @contextmenu.prevent="showDeleteCharacterDialog">
          <TrashIcon class="size-4" />
        </button>
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useSceneStore } from '../../../../store/scene'
import { DocumentTextIcon, MapPinIcon, TrashIcon, Square2StackIcon } from '@heroicons/vue/24/outline'
import CharacterHpBar from './CharacterHpBar.vue'
import { computed, ref } from 'vue'
import { useCardStore } from '../../../../store/card'
import { IRiItem } from '@paotuan/types'

const props = defineProps<{ chara: IRiItem }>()

const sceneStore = useSceneStore()
const showNpcCard = () => (sceneStore.currentPreviewCardCharacter = props.chara)
const addCharacterToken = () => sceneStore.addCharacterToken(props.chara)
// npc 卡片信息（for template
const cardStore = useCardStore()
const npcCardnn = computed(() => cardStore.getCardOfId(props.chara.id)!)

// 上传 npc 头像
const realUploadBtn = ref<HTMLInputElement>()

const handleFile = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target!.result as string
      // eslint-disable-next-line vue/no-mutating-props
      props.chara.avatar = imageUrl
    }
    reader.readAsDataURL(files![0])
  }
}

const uploadAvatar = () => {
  realUploadBtn.value?.click()
}

const deleteCharacter = () => {
  sceneStore.deleteCharacter(props.chara)
}

const showDeleteCharacterDialog = () => {
  sceneStore.currentOnDeleteCharacter = props.chara
}
</script>

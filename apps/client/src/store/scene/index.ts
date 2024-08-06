import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { cloneDeep, escapeRegExp } from 'lodash'
import { nanoid } from 'nanoid/non-secure'
import { getDefaultStageData } from './map'
import { IRiItem, VERSION_CODE } from '@paotuan/types'
import { yChannelStoreRef, yGlobalStoreRef } from '../ystore'
import { isEmptyNumber } from '../../utils'
import { useCardStore } from '../card'

export const useSceneStore = defineStore('scene', () => {
  // 地图列表
  const mapMap = computed(() => yGlobalStoreRef.value?.scenes ?? {})
  const mapList = computed(() => Object.values(mapMap.value))
  // 当前打开的地图
  const currentMapId = ref<string | null>(null)
  const getCurrentMapData = () => currentMapId.value ? mapMap.value[currentMapId.value] : undefined
  const hasCurrentMap = computed(() => !!getCurrentMapData())

  // 新建地图
  const createMap = () => {
    const id = nanoid()
    mapMap.value[id] = { id, name: '未命名', createAt: Date.now(), stage: getDefaultStageData() }
    return id
  }

  // 切换地图
  const switchMap = (newMapId: string) => {
    currentMapId.value = newMapId
  }

  // 删除地图
  const deleteMap = (mapId: string) => {
    // 1. 去掉当前地图 id
    if (currentMapId.value === mapId) {
      currentMapId.value = null
    }
    // 2. 删除内存
    delete mapMap.value[mapId]
  }

  // 添加人物 token 到当前地图中
  const addCharacterToken = (type: 'actor' | 'npc', id: string) => {
    // todo eventBus
  }

  // 时间指示器
  const timeIndicator = ref(new Date())
  // 战斗轮指示器
  const turn = ref(1)

  // 人物列表
  const characters = computed(() => yChannelStoreRef.value?.ri ?? [])
  const charactersSorted = computed(
    () => characters.value.toSorted((a, b) => {
      const seq1Res = compareSeq(a.seq, b.seq)
      return seq1Res === 0 ? compareSeq(a.seq2, b.seq2) : seq1Res
    })
  )
  // 当前选择人物
  const currentSelectedCharacter = ref<IRiItem | undefined>(undefined)

  // 添加人物，如果人物已存在，则改为选中该人物以提示用户
  const addCharacter = (chara: IRiItem) => {
    const existCharacter = characters.value.find(exist => chara.type === exist.type && chara.id === exist.id)
    if (existCharacter) {
      currentSelectedCharacter.value = existCharacter
    } else {
      characters.value.push(chara)
    }
  }

  // 删除人物
  const deleteCharacter = (chara: IRiItem) => {
    const index = characters.value.indexOf(chara)
    if (index >= 0) {
      characters.value.splice(index, 1)
      // 删除人物不强制移除 token，可以选中该 token 让用户自己选择是否要删除
      // 例如想要清空先攻列表重骰的情况不代表想移除 token
      currentSelectedCharacter.value = chara
    }
  }

  // 复制 npc
  const duplicateNpc = (chara: IRiItem) => {
    const dup = cloneDeep(chara)
    // 改名，提取后面的数字
    const matchNum = chara.id.match(/(\d+)$/)
    const nameWithoutNum = matchNum ? chara.id.slice(0, matchNum.index) : chara.id // 去掉后面的数字
    const pattern = new RegExp(`^${escapeRegExp(nameWithoutNum)}(\\d+)$`)
    // 找到当前列表中符合 名字+数字 的 npc 中，最大的数字
    let maxNum = 1
    characters.value.forEach(exist => {
      if (exist.type === 'npc') {
        const match = exist.id.match(pattern)
        if (match) {
          const num = parseInt(match[1])
          maxNum = Math.max(num, maxNum)
        }
      }
    })
    dup.id = dup.name = nameWithoutNum + (maxNum + 1)
    // 加入列表
    characters.value.push(dup)
    // 如果原 npc 有人物卡，则也复制人物卡
    const cardStore = useCardStore()
    const cardData = cardStore.of(chara.id)
    if (cardData) {
      const dupCardData = cloneDeep(cardData)
      dupCardData.name = dup.id
      cardStore.importCard(dupCardData)
    }
  }

  // 当前选中展示人物卡的 npc 名字
  const currentCardNpcName = ref<string | null>(null)
  const currentCardNpc = computed<IRiItem | null>({
    get: () => characters.value.find(chara => chara.type === 'npc' && chara.id === currentCardNpcName.value) ?? null,
    set: (value: IRiItem | null) => (currentCardNpcName.value = value ? value.id : null)
  })

  // 发送地图图片指示器
  const sendMapImageSignal = ref(false)

  // 人物列表自定义列
  const customColumns = ref<{ id: string, name: string }[]>(loadCustomColumns())
  watch(customColumns, value => saveCustomColumns(value))

  return {
    mapList,
    currentMapId,
    getCurrentMapData,
    hasCurrentMap,
    timeIndicator,
    turn,
    createMap,
    switchMap,
    deleteMap,
    addCharacterToken,
    charactersSorted,
    currentSelectedCharacter,
    addCharacter,
    deleteCharacter,
    duplicateNpc,
    currentCardNpcName,
    currentCardNpc,
    sendMapImageSignal,
    customColumns
  }
})

// 先攻值比较
function compareSeq(a: number, b: number) {
  if (isEmptyNumber(a) && isEmptyNumber(b)) return 0
  if (isEmptyNumber(a)) return 1
  if (isEmptyNumber(b)) return -1
  return b - a
}

function saveCustomColumns(list: { id: string, name: string }[]) {
  const save = JSON.stringify({ version: VERSION_CODE, data: list })
  localStorage.setItem('scene-customColumns', save)
}

function loadCustomColumns(): { id: string, name: string }[] {
  const save = localStorage.getItem('scene-customColumns')
  if (!save) return []
  try {
    const { data } = JSON.parse(save)
    return data
  } catch (e) {
    return []
  }
}

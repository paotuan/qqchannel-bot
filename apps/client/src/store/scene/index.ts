import { defineStore } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useIndexedDBStore } from '../../utils/db'
import { cloneDeep, escapeRegExp, throttle } from 'lodash'
import { nanoid } from 'nanoid/non-secure'
import { getDefaultStageData, useStage } from './map'
import type { IStageData } from './map-types'
import { IRiItem, VERSION_CODE } from '@paotuan/types'
import { yChannelStoreRef } from '../ystore'
import { isEmptyNumber } from '../../utils'
import { useCardStore } from '../card'

// 场景地图
export interface ISceneMap {
  id: string,
  name: string,
  deleted: boolean, // 临时标记是否删除
  createAt: number,
  stage: ReturnType<typeof useStage>,
  data?: unknown // stage.toJson() 临时保存数据库用
}

export const useSceneStore = defineStore('scene', () => {
  // 地图列表
  const mapMap = reactive<Record<string, ISceneMap>>({})
  const mapList = computed(() => Object.values(mapMap))
  // 当前打开的地图
  const currentMapId = ref<string | null>(null)
  const currentMap = computed(() => currentMapId.value ? mapMap[currentMapId.value] : null)

  // 新建地图
  const createMap = () => {
    const id = nanoid()
    mapMap[id] = { id, name: '未命名', deleted: false, createAt: Date.now(), stage: useStage() }
    return id
  }

  // 切换地图
  const switchMap = (newMapId: string) => {
    currentMapId.value = newMapId
  }

  // 保存地图
  const saveMap = (map: ISceneMap) => {
    // 异步保存 db
    const throttledFunc = getThrottledSaveFunc(map.id)
    throttledFunc(map)
  }

  // 删除地图
  const deleteMap = (map: ISceneMap) => {
    // 1. 去掉当前地图 id
    if (currentMapId.value === map.id) {
      currentMapId.value = null
    }
    // 2. 删除内存
    map.deleted = true // 打上标记避免被切换地图逻辑再次保存
    delete mapMap[map.id]
    // 3. 删除 db
    deleteMapInDB(map)
  }

  // 初始化读取 indexeddb 地图列表
  ;(async () => {
    try {
      const handler = await useIndexedDBStore<ISceneMap>('scene-map')
      const list = handleSceneMapUpgrade(await handler.getAll()) // 处理版本升级逻辑
      if (list.length > 0) {
        list.sort((a, b) => a.createAt - b.createAt)
        list.forEach(item => {
          item.stage = useStage(item.data as IStageData) // 反序列化
          item.data = undefined
          mapMap[item.id] = item
        })
      }
    } catch (e) {
      console.error('获取场景列表失败', e)
    }
  })()

  // 自动保存逻辑，切换地图或地图内容变化时
  watch(currentMap, (newMap, oldMap) => {
    if (newMap && !newMap.deleted) {
      saveMap(newMap)
    }
    if (oldMap && !oldMap.deleted) {
      saveMap(oldMap)
    }
  }, { deep: true })

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
    currentMap,
    timeIndicator,
    turn,
    createMap,
    switchMap,
    saveMap,
    deleteMap,
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

// map 数据结构版本升级逻辑。理论上放这里和放 db 层都行。这里的话更内聚一点吧
function handleSceneMapUpgrade(data: any[]): ISceneMap[] {
  return data.map(item => {
    // 1. stageData 增加 grid
    if (!item.data.grid) {
      item.data.grid = getDefaultStageData().grid
    }
    item.data.items.forEach((token: any) => {
      // 2. IBaseStageItem 增加 remark, visible
      if (typeof token['data-remark'] === 'undefined') {
        token['data-remark'] = token.name
      }
      if (typeof token.visible === 'undefined') {
        token.visible = true
      }
    })
    return item
  })
}

async function saveMapInDB(item: ISceneMap) {
  // 放在这里执行，确保每次保存的是 stage 的最新状态
  const itemCopy = { ...item, stage: undefined, data: item.stage.toJson() }
  try {
    const handler = await useIndexedDBStore<ISceneMap>('scene-map')
    await handler.put(itemCopy) // 要解包，不能传 proxy，否则无法保存
    console.log('保存场景', item.name)
  } catch (e) {
    console.error('保存场景失败', item.name, e)
    console.log(itemCopy)
  }
}

// 根据 map id 获取对应的 throttle 方法，不同 map id 不能 throttle，否则会冲掉前一个 map 的保存
// todo 是否需要一个 orm
const throttledSaveMapMap: Record<string, ReturnType<typeof throttle<typeof saveMapInDB>>> = {}
function getThrottledSaveFunc(id: string) {
  let func = throttledSaveMapMap[id]
  if (!func) {
    func = throttledSaveMapMap[id] = throttle(saveMapInDB, 5000, { leading: false })
  }
  return func
}

async function deleteMapInDB(item: ISceneMap) {
  try {
    // 清除该地图定时保存的逻辑
    const throttledFunc = getThrottledSaveFunc(item.id)
    throttledFunc.cancel()
    // 删除数据库
    const handler = await useIndexedDBStore<ISceneMap>('scene-map')
    await handler.delete(item.id)
    console.log('删除场景', item.name)
  } catch (e) {
    console.error('删除场景失败', item.name, e)
  }
}

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

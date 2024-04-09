import { defineStore } from 'pinia'
import { computed, reactive, ref, toRaw, watch } from 'vue'
import { useIndexedDBStore } from '../../utils/db'
import { cloneDeep, escapeRegExp, throttle } from 'lodash'
import { nanoid } from 'nanoid/non-secure'
import { getDefaultStageData, useStage } from './map'
import type { IStageData } from './map-types'
import type { IRiItem } from '@paotuan/types'
import ws from '../../api/ws'
import type { IRiSetReq } from '@paotuan/types'
import type { ICard } from '@paotuan/types'
import { createCard } from '@paotuan/types'
import { VERSION_CODE } from '@paotuan/types'

// 场景地图
export interface ISceneMap {
  id: string,
  name: string,
  deleted: boolean, // 临时标记是否删除
  createAt: number,
  stage: ReturnType<typeof useStage>,
  data?: unknown // stage.toJson() 临时保存数据库用
}

// 先攻列表角色
export interface ISceneActor {
  type: 'actor'
  userId: string // 用户 id
  seq: number
  seq2: number
}

export interface ISceneNpc {
  type: 'npc'
  userId: string // npc 唯一标识，同时也用作展示
  avatar?: string // npc 图片，可上传
  seq: number
  seq2: number
  embedCard?: ICard
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
  const characters = reactive<(ISceneActor | ISceneNpc)[]>(temp_loadCharacterList())
  const charactersSorted = computed(
    () => [...characters].sort((a, b) => {
      const seq1Res = compareSeq(a.seq, b.seq)
      return seq1Res === 0 ? compareSeq(a.seq2, b.seq2) : seq1Res
    })
  )
  // 当前选择人物
  const currentSelectedCharacter = ref<ISceneActor | ISceneNpc | null>(null)

  // 添加人物，如果人物已存在，则改为选中该人物以提示用户
  const addCharacter = (chara: ISceneActor | ISceneNpc) => {
    const existCharacter = characters.find(exist => chara.type === exist.type && chara.userId === exist.userId)
    if (existCharacter) {
      currentSelectedCharacter.value = existCharacter
    } else {
      characters.push(chara)
      // 同步服务端
      addCharaSyncRiList(chara)
    }
  }

  // 删除人物
  const deleteCharacter = (chara: ISceneActor | ISceneNpc) => {
    const index = characters.indexOf(chara)
    if (index >= 0) {
      characters.splice(index, 1)
      // 如果该人物正被选中，则移除选中态
      if (currentSelectedCharacter.value === chara) {
        currentSelectedCharacter.value = null
      }
      // 移除该人物在地图中的 token
      mapList.value.forEach(map => {
        map.stage.removeCharacter(chara.type, chara.userId)
      })
    }
  }

  // 人物列表自动保存
  watch(characters, value => {
    temp_saveCharacterList(value)
  }, { deep: true })

  // 更新人物先攻列表
  const updateCharacterRiList = (list: IRiItem[]) => {
    // 1. 删除不存在的角色
    const charas2delete = characters.filter(chara => {
      const exist = list.find(ri => ri.type === chara.type && ri.id === chara.userId)
      return !exist
    })
    // charas2delete.forEach(chara => deleteCharacter(chara))
    // 不删除，只清空先攻，以避免现在同步的问题。人物列表只由前端决定
    charas2delete.forEach(chara => {
      chara.seq = NaN
      chara.seq2 = NaN
    })
    // 2. 更新或添加角色
    list.forEach(ri => {
      const exist = characters.find(chara => ri.type === chara.type && ri.id === chara.userId)
      if (exist) {
        exist.seq = ri.seq
        exist.seq2 = ri.seq2
      } else {
        characters.push({ type: ri.type, userId: ri.id, seq: ri.seq, seq2: ri.seq2 })
      }
    })
  }

  // 复制 npc
  const duplicateNpc = (chara: ISceneNpc) => {
    const dup = cloneDeep(chara)
    // 改名，提取后面的数字
    const matchNum = chara.userId.match(/(\d+)$/)
    const nameWithoutNum = matchNum ? chara.userId.slice(0, matchNum.index) : chara.userId // 去掉后面的数字
    const pattern = new RegExp(`^${escapeRegExp(nameWithoutNum)}(\\d+)$`)
    // 找到当前列表中符合 名字+数字 的 npc 中，最大的数字
    let maxNum = 1
    characters.forEach(exist => {
      if (exist.type === 'npc') {
        const match = exist.userId.match(pattern)
        if (match) {
          const num = parseInt(match[1])
          maxNum = Math.max(num, maxNum)
        }
      }
    })
    dup.userId = nameWithoutNum + (maxNum + 1)
    // 加入列表
    characters.push(dup)
    // 同步服务端
    addCharaSyncRiList(dup)
  }

  // 当前选中展示人物卡的 npc 名字
  const currentCardNpcName = ref<string | null>(null)
  const currentCardNpc = computed<ISceneNpc | null>({
    get: () => currentCardNpcName.value
      ? characters.find(chara => chara.type === 'npc' && chara.userId === currentCardNpcName.value) as ISceneNpc
      : null,
    set: (value: ISceneNpc | null) => (currentCardNpcName.value = value ? value.userId : null)
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
    updateCharacterRiList,
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

// 添加角色同步到服务端先攻列表
function addCharaSyncRiList(chara: ISceneActor | ISceneNpc) {
  ws.send<IRiSetReq>({
    cmd: 'ri/set',
    data: {
      type: chara.type,
      id: chara.userId,
      seq: chara.seq,
      seq2: chara.seq2
    }
  })
}

// 先攻值比较
function compareSeq(a: number, b: number) {
  if (isNaN(a) && isNaN(b)) return 0
  if (isNaN(a)) return 1
  if (isNaN(b)) return -1
  return b - a
}

// region 临时本地保存人物列表
function temp_saveCharacterList(list: (ISceneActor | ISceneNpc)[]) {
  // 不存先攻，避免和后端的同步问题
  const data = list.map(item => {
    if (item.type === 'actor') {
      const { seq, seq2, ...rest } = item
      return { ...rest }
    } else {
      const { embedCard, seq, seq2, ...rest } = item
      return { ...rest, embedCardData: toRaw(embedCard?.data) }
    }
  })
  const save = JSON.stringify({ version: VERSION_CODE, data })
  localStorage.setItem('scene-characterList', save)
}

function temp_loadCharacterList(): (ISceneActor | ISceneNpc)[] {
  const save = localStorage.getItem('scene-characterList')
  if (!save) return []
  try {
    const { data } = JSON.parse(save)
    const list = data.map((item: any) => {
      if (item.type === 'actor') {
        return {
          type: 'actor',
          userId: item.userId,
          seq: NaN,
          seq2: NaN
        } as ISceneActor
      } else {
        return {
          type: 'npc',
          userId: item.userId,
          avatar: item.avatar,
          seq: NaN,
          seq2: NaN,
          embedCard: item.embedCardData ? createCard(item.embedCardData) : undefined
        } as ISceneNpc
      }
    })
    return list
  } catch (e) {
    return []
  }
}
// endregion

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

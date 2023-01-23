import { defineStore } from 'pinia'
import { computed, reactive, ref, toRaw } from 'vue'
import Konva from 'konva'
import { useIndexedDBStore } from '../utils/db'
import { cloneDeep, escapeRegExp, throttle } from 'lodash'
import { nanoid } from 'nanoid/non-secure'

// 场景地图
export interface ISceneMap {
  id: string,
  name: string,
  deleted: boolean, // 临时标记是否删除
  createAt: number,
  data?: unknown // stage.toJSON()
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
  name: string // npc 目前以 name 为唯一标识
  avatar?: string // npc 图片，可上传
  seq: number
  seq2: number
  embedCard: {
    hp: number
    ext: string
  }
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
    mapMap[id] = { id, name: '未命名', deleted: false, createAt: Date.now() }
    return id
  }

  // 切换地图
  const switchMap = (newMapId: string) => {
    currentMapId.value = newMapId
  }

  // 保存地图
  const saveMap = (map: ISceneMap, stage: Konva.Stage, saveMemorySync = false) => {
    // 是否同步序列化 stage data 到内存中
    if (saveMemorySync) {
      map.data = stage.toJSON()
    }
    // 异步保存 db
    const throttledFunc = getThrottledSaveFunc(map.id)
    throttledFunc(map, stage)
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
      const list = await handler.getAll() as ISceneMap[]
      if (list.length > 0) {
        list.sort((a, b) => a.createAt - b.createAt)
        list.forEach(item => (mapMap[item.id] = item))
      }
    } catch (e) {
      console.error('获取场景列表失败', e)
    }
  })()

  // 时间指示器
  const timeIndicator = ref(new Date())
  // 战斗轮指示器
  const turn = ref(1)

  // 人物列表
  const characters = reactive<(ISceneActor | ISceneNpc)[]>([])
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
    const existCharacter = characters.find(exist => {
      if (chara.type === 'actor' && exist.type === 'actor' && chara.userId === exist.userId) {
        return true // 相同的 actor
      } else if (chara.type === 'npc' && exist.type === 'npc' && chara.name === exist.name) {
        return true // 相同的 npc
      } else {
        return false
      }
    })
    if (existCharacter) {
      currentSelectedCharacter.value = existCharacter
    } else {
      characters.push(chara)
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
      // 移除该人物在地图中的 token。只移除当前地图的，其他不管了
      // todo
    }
  }

  // 复制 npc
  const duplicateNpc = (chara: ISceneNpc) => {
    const dup = cloneDeep(chara)
    // 改名，提取后面的数字
    const matchNum = chara.name.match(/(\d+)$/)
    const nameWithoutNum = matchNum ? chara.name.slice(0, matchNum.index) : chara.name // 去掉后面的数字
    const pattern = new RegExp(`^${escapeRegExp(nameWithoutNum)}(\\d+)$`)
    // 找到当前列表中符合 名字+数字 的 npc 中，最大的数字
    let maxNum = 1
    characters.forEach(exist => {
      if (exist.type === 'npc') {
        const match = exist.name.match(pattern)
        if (match) {
          const num = parseInt(match[1])
          maxNum = Math.max(num, maxNum)
        }
      }
    })
    dup.name = nameWithoutNum + (maxNum + 1)
    // 加入列表
    characters.push(dup)
  }

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
    duplicateNpc
  }
})

async function saveMapInDB(item: ISceneMap, stage: Konva.Stage) {
  // 放在这里执行，确保每次保存的是 stage 的最新状态，并减少 toJSON 调用开销
  // 缺点是 stage 的生命周期被延长了，严格来说大概能算内存泄露了
  item.data = stage.toJSON()
  try {
    const handler = await useIndexedDBStore<ISceneMap>('scene-map')
    await handler.put(toRaw(item)) // 要解包，不能传 proxy，否则无法保存
  } catch (e) {
    console.error('保存场景失败', item.name, e)
    console.log(toRaw(item))
  }
}

// 根据 map id 获取对应的 throttle 方法，不同 map id 不能 throttle，否则会冲掉前一个 map 的保存
// todo 是否需要一个 orm
const throttledSaveMapMap: Record<string, ReturnType<typeof throttle<typeof saveMapInDB>>> = {}
function getThrottledSaveFunc(id: string) {
  let func = throttledSaveMapMap[id]
  if (!func) {
    func = throttledSaveMapMap[id] = throttle(saveMapInDB, 5000)
  }
  return func
}

async function deleteMapInDB(item: ISceneMap) {
  try {
    const handler = await useIndexedDBStore<ISceneMap>('scene-map')
    await handler.delete(item.id)
  } catch (e) {
    console.error('删除场景失败', item.name, e)
  }
}

// 先攻值比较
function compareSeq(a: number, b: number) {
  if (isNaN(a) && isNaN(b)) return 0
  if (isNaN(a)) return 1
  if (isNaN(b)) return -1
  return b - a
}

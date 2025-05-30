import { computed, reactive, toRef } from 'vue'
import type {
  ICircleToken,
  IRectToken,
  IPolygonToken,
  IWedgeToken, IStarToken, IArrowToken, ITextLabel, ICharacterItem, ILayer,
  ICustomToken, ITextEditConfig, IToken, ITokenEditConfig
} from './map-types'
import { nanoid } from 'nanoid/non-secure'
import { cloneDeep } from 'lodash'
import { useStageBackground } from './map-background'
import { useStageItems } from './map-items'
import { useStageSelect } from './map-select'
import type { ISceneMap, IStageData } from '@paotuan/types'

export const getDefaultStageData: () => IStageData = () => ({
  x: 0,
  y: 0,
  background: null,
  items: [],
  grid: {
    show: false,
    gap: 40,
    stroke: '#f5f5f5',
    xOffset: 0,
    yOffset: 0
  }
})

// 外部切换场景时重置，确保同一个 scene 里面 data 是不可变的
// 有助于简化响应式传递，方法内部可以做一些性能优化的处理
export function useSceneMap(data: ISceneMap) {
  const id = computed(() => data.id)
  const createAt = computed(() => data.createAt)
  const name = toRef(data, 'name')

  const stage = useStage(data.stage)

  return reactive({
    id,
    createAt,
    name,
    stage
  })
}

// initial value, 相当于构造函数
function useStage(data: IStageData) {
  const x = toRef(data, 'x')
  const y = toRef(data, 'y')
  const { background, setBackground, setBackgroundScale } = useStageBackground(data, x, y)
  const { getItem, findItem, addItem, removeItem, moveItem, items } = useStageItems(data)
  const { selectNodeIds, selectNode, clearSelection } = useStageSelect()
  const grid = computed(() => data.grid)

  // 添加 token
  const addToken = (type: string, config: ITokenEditConfig) => {
    const token = createToken(type, x.value, y.value, config)
    addItem(token)
    selectNode(token)
  }

  // 添加自定义图片 token
  const addCustomToken = (src: string) => {
    const token: ICustomToken = {
      id: nanoid(),
      x: window.innerWidth / 2 - x.value,
      y: window.innerHeight / 2 - y.value,
      scaleX: 0.5,
      scaleY: 0.5,
      rotation: 0,
      visible: true,
      'data-src': src,
      name: 'custom-token',
      'data-remark': '自定义Token'
    }
    addItem(token)
    selectNode(token)
  }

  // 添加文字标签
  const addTextLabel = (config: ITextEditConfig) => {
    const token: ITextLabel = {
      id: nanoid(),
      x: window.innerWidth / 2 - x.value,
      y: window.innerHeight / 2 - y.value,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      visible: true,
      name: 'text',
      'data-remark': 'text',
      fill: config.fill,
      stroke: config.stroke,
      text: config.text,
      fontFamily: 'Calibri',
      fontSize: 18,
      padding: 5
    }
    addItem(token)
    selectNode(token)
  }

  // 获取场景中的玩家或 npc
  const findCharacter = (type: 'actor' | 'npc', userId: string) => {
    const [chara] = findItem(item =>
      item.name === 'character' &&
      (item as ICharacterItem)['data-chara-type'] === type &&
      (item as ICharacterItem)['data-chara-id'] === userId
    )
    return chara
  }

  // 添加玩家或 npc 标志。如已经存在，则选中它
  const addCharacter = (type: 'actor' | 'npc', userId: string) => {
    // 判断是否已经存在了
    const exist = findCharacter(type, userId)
    if (exist) {
      selectNodeIds.value = [exist.id]
    } else {
      const token: ICharacterItem = {
        id: nanoid(),
        x: window.innerWidth / 2 - x.value,
        y: window.innerHeight / 2 - y.value,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        visible: true,
        name: 'character',
        'data-remark': 'character',
        'data-chara-type': type,
        'data-chara-id': userId
      }
      addItem(token)
      selectNode(token)
    }
  }

  // 删除玩家或 npc
  const removeCharacter = (type: 'actor' | 'npc', userId: string) => {
    const exist = findCharacter(type, userId)
    if (exist?.id) {
      destroyNode(exist.id)
    }
  }

  // 复制 token
  const duplicateToken = (id: string) => {
    const [old, parent] = findItem(item => item.id === id)
    if (!old) return
    const newItem = cloneDeep(old)
    newItem.id = nanoid()
    newItem.x = old.x + 20
    newItem.y = old.y + 20
    addItem(newItem, parent)
    // 选中新 item
    selectNode(newItem)
  }

  // 添加图层
  const addLayer = () => {
    const layer: ILayer = {
      name: 'layer',
      id: nanoid(),
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      visible: true,
      'data-remark': '图层',
      children: []
    }
    addItem(layer)
  }

  // 移到顶层
  const bringToFront = (id: string) => {
    const [self, parent] = findItem(item => item.id === id)
    if (!self) return
    const list = parent?.children ?? items.value
    const selfOldIndex = list.indexOf(self)
    if (selfOldIndex < 0) return // 理论上不可能
    // 新的 index，如果都是在顶级移动，需要考虑 remove 以后 index - 1
    moveNode(parent?.id, selfOldIndex, undefined, list === items.value ? items.value.length - 1 : items.value.length)
  }

  // 移到底层
  const bringToBottom = (id: string) => {
    const [self, parent] = findItem(item => item.id === id)
    if (!self) return
    const list = parent?.children ?? items.value
    const selfOldIndex = list.indexOf(self)
    if (selfOldIndex < 0) return // 理论上不可能
    moveNode(parent?.id, selfOldIndex, undefined, 0)
  }

  // 移动元素
  const moveNode = (from: string | undefined, fromIndex: number, to: string | undefined, toIndex: number) => {
    moveItem(from, fromIndex, to, toIndex)
    clearSelection() // move 后 selection 会有问题，干脆 clear
  }

  // 删除元素
  const destroyNode = (id: string) => {
    const item = getItem(id)
    if (item) {
      removeItem(item)
      // 如果 transform 处于选中态也要一并移除
      clearSelection()
    }
  }

  // 统一套一层 reactive 以获得正确的类型推断
  // 不然在外面被 reactive 包裹后发生 ref 解包，导致 ReturnType<typeof useStage> 推断出的类型和实际不一致
  return reactive({
    x,
    y,
    background,
    setBackground,
    setBackgroundScale,
    selectNodeIds,
    items,
    getItem,
    moveNode,
    grid,
    addToken,
    addCustomToken,
    addTextLabel,
    addCharacter,
    removeCharacter,
    duplicateToken,
    addLayer,
    bringToFront,
    bringToBottom,
    destroyNode,
  })
}

function createToken(type: string, stageX: number, stageY: number, config: ITokenEditConfig) {
  const commonConfig: IToken = {
    id: nanoid(),
    x: window.innerWidth / 2 - stageX, // 由于 stage 可拖动，确保起始点相对于屏幕位置不变，而不是相对 stage
    y: window.innerHeight / 2 - stageY, // 否则会出现 stage 拖动导致添加的图形不在可视范围内的情况
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    visible: true,
    fill: config.fill,
    stroke: config.stroke,
    strokeWidth: 3,
    name: type,
    'data-remark': type
  }
  switch (type) {
  case 'circle':
    return {
      ...commonConfig,
      radius: 30,
    } as ICircleToken
  case 'rect':
    return {
      ...commonConfig,
      width: 60,
      height: 60
    } as IRectToken
  case 'polygon':
    return {
      ...commonConfig,
      sides: config.polygonSides,
      radius: 30,
    } as IPolygonToken
  case 'wedge':
    return {
      ...commonConfig,
      radius: 60,
      angle: config.wedgeAngle,
    } as IWedgeToken
  case 'star':
    return {
      ...commonConfig,
      numPoints: config.starPoints,
      innerRadius: 15,
      outerRadius: 30,
    } as IStarToken
  case 'arrow':
    return {
      ...commonConfig,
      points: [0, 0, 50, 50],
      pointerLength: 10,
      pointerWidth: 10,
    } as IArrowToken
  default:
    throw new Error('unknown token type: ' + type)
  }
}

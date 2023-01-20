import Konva from 'konva'
import { shallowRef } from 'vue'

export interface IStageStructure {
  stage: Konva.Stage
  backgroundLayer: Konva.Layer
  contentLayer: Konva.Layer
  transformer: Konva.Transformer
}

export interface IStageEvents {
  onSelect: (elems: IStageStructure, nodes: Konva.Node[]) => void
  onContextMenu: (elems: IStageStructure, node: Konva.Node) => void
  onAutoSave: (elems: IStageStructure) => void
}

function createNewStage(htmlElement: HTMLDivElement): IStageStructure {
  // stage 基础层级
  const stage = new Konva.Stage({
    container: htmlElement,
    draggable: true,
    width: htmlElement.clientWidth,
    height: htmlElement.clientHeight
  })

  const backgroundLayer = new Konva.Layer({ id: 'background' })
  const contentLayer = new Konva.Layer({ id: 'content' })
  const transformer = new Konva.Transformer()
  stage.add(backgroundLayer)
  stage.add(contentLayer)
  contentLayer.add(transformer)

  return { stage, backgroundLayer, contentLayer, transformer }
}

function loadStage(stageData: any, htmlElement: HTMLDivElement): IStageStructure {
  const stage = Konva.Node.create(stageData, htmlElement) as Konva.Stage
  // 根据当前的 htmlElement 重新设置宽高
  stage.width(htmlElement.clientWidth)
  stage.height(htmlElement.clientHeight)
  // 恢复图片
  const images = stage.find<Konva.Image>('Image')
  images.forEach(image => {
    const imageUrl = image.getAttr('data-src')
    if (!imageUrl) return
    const imageObj = new Image()
    imageObj.onload = () => image.image(imageObj)
    imageObj.src = imageUrl
  })
  // 获取 layer 和 transformer
  const backgroundLayer = stage.findOne<Konva.Layer>('#background')
  const contentLayer = stage.findOne<Konva.Layer>('#content')
  const transformer = stage.findOne<Konva.Transformer>('Transformer')

  return { stage, backgroundLayer, contentLayer, transformer }
}

function bindStageEvents(elems: IStageStructure, events: IStageEvents) {
  const { stage, transformer } = elems

  // 选择一个或多个 token 的逻辑
  // clicks should select/deselect shapes
  stage.on('click tap', (e) => {
    // if click on empty area - remove all selections
    if (e.target === stage) {
      events.onSelect(elems, [])
      return
    }

    // todo 实现一个通用的只选择 layer 直接子元素功能
    let target: Konva.Node = e.target
    if (target instanceof Konva.Text) {
      target = e.target.getAncestors()[0]
    }


    // do we press shift or ctrl?
    const metaPressed = e.evt.shiftKey // || e.evt.ctrlKey || e.evt.metaKey
    const isSelected = transformer.nodes().indexOf(target) >= 0

    if (!metaPressed && !isSelected) {
      // if no key pressed and the node is not selected
      // select just one
      events.onSelect(elems, [target])
    } else if (metaPressed && isSelected) {
      // if we pressed keys and node was selected
      // we need to remove it from selection:
      const nodes = transformer.nodes().slice() // use slice to have new copy of array
      // remove node from array
      nodes.splice(nodes.indexOf(target), 1)
      events.onSelect(elems, nodes)
    } else if (metaPressed && !isSelected) {
      // add the node into selection
      const nodes = transformer.nodes().concat([target])
      events.onSelect(elems, nodes)
    }
  })

  // 右键菜单 https://konvajs.org/docs/sandbox/Canvas_Context_Menu.html
  stage.on('contextmenu', (e) => {
    // prevent default behavior
    e.evt.preventDefault()
    if (e.target === stage) {
      // if we are on empty place of the stage we will do nothing
      return
    }

    // todo 实现一个通用的只选择 layer 直接子元素功能
    let target: Konva.Node = e.target
    if (target instanceof Konva.Text) {
      target = e.target.getAncestors()[0]
    }

    events.onContextMenu(elems, target)
  })

  // 监听到用户操作，触发自动保存逻辑
  stage.on('dragend', () => {
    events.onAutoSave(elems)
  })

  // transformend 经测试 stage 上监听不到
  transformer.on('transformend', () => {
    events.onAutoSave(elems)
  })
}

function loadOrCreateStage(stageData: any, htmlElement: HTMLDivElement) {
  return stageData ? loadStage(stageData, htmlElement) : createNewStage(htmlElement)
}

export function useStage(eventHandlers: IStageEvents) {
  const stage = shallowRef<Konva.Stage | null>(null)
  // 随便初始化个不用的，避免后面频繁判空
  const backgroundLayer = shallowRef(new Konva.Layer()) // 背景层
  const contentLayer = shallowRef(new Konva.Layer()) // token 层
  const transformer = shallowRef(new Konva.Transformer()) // 选择器

  const loadStage = (stageData: any, htmlElement: HTMLDivElement) => {
    // 1. 反序列化出对应的 Konva 结构
    const structure = loadOrCreateStage(stageData, htmlElement)
    // 2. 添加事件监听器
    bindStageEvents(structure, eventHandlers)
    // 3. 维护最新的引用
    stage.value = structure.stage
    backgroundLayer.value = structure.backgroundLayer
    contentLayer.value = structure.contentLayer
    transformer.value = structure.transformer
  }

  return {
    stage,
    backgroundLayer,
    contentLayer,
    transformer,
    loadStage
  }
}

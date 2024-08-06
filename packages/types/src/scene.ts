// 场景地图
export interface ISceneMap {
  id: string,
  name: string,
  createAt: number,
  stage: IStageData,
}

// map 整体数据结构
export interface IStageData {
  x: number
  y: number
  background: IStageBackground | null
  items: IBaseStageItem[]
  grid: IGridConfig
}

// 基础 token
export interface IBaseStageItem {
  name: string // used as type
  id: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  visible: boolean
  'data-remark': string // 备注
}

// 背景图片
export interface IStageBackground extends IBaseStageItem {
  name: 'map'
  'data-src': string
}

// 网格数据兼配置项
export interface IGridConfig {
  show: boolean
  gap: number
  stroke: string
  xOffset: number
  yOffset: number
}

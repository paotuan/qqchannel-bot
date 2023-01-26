// 对 stage 上存在的各种元素进行建模，抽象出 map 的数据结构

// 基础 token
export interface IBaseStageItem {
  name: string
  id?: string
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
}

export interface IToken extends IBaseStageItem {
  fill: string
  stroke: string
  strokeWidth: number
}

export interface ICircleToken extends IToken {
  name: 'circle'
  radius: number
}

export interface IRectToken extends IToken {
  name: 'rect'
  width: number
  height: number
}

export interface IPolygonToken extends IToken {
  name: 'polygon'
  sides: number
  radius: number
}

export interface IWedgeToken extends IToken {
  name: 'wedge'
  radius: number
  angle: number
}

export interface IStarToken extends IToken {
  name: 'star'
  numPoints: number
  innerRadius: number
  outerRadius: number
}

export interface IArrowToken extends IToken {
  name: 'arrow'
  points: [number, number, number, number]
  pointerLength: number
  pointerWidth: number
}

// 自定义图片 token
export interface ICustomToken extends IBaseStageItem {
  name: 'custom-token'
  'data-src': string // base64
}

// 文字
export interface ITextLabel extends IBaseStageItem {
  name: 'text'
  fill: string
  stroke: string
  text: string
  fontFamily: string
  fontSize: number
  padding: number
}

// 背景图片
export interface IStageBackground extends IBaseStageItem {
  name: 'map'
  'data-src': string
  // listening: false
}

// token 编辑所涉及的配置项
export interface ITokenEditConfig {
  fill: string
  stroke: string
  polygonSides: number
  wedgeAngle: number
  starPoints: number
}

// 文字编辑配置项
export interface ITextEditConfig {
  text: string
  fill: string
  stroke: string
}

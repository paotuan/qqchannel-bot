import type { IBaseStageItem } from '@paotuan/types'

// 图层
export interface ILayer extends IBaseStageItem {
  name: 'layer'
  children: IBaseStageItem[]
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

// 玩家/npc 标识
export interface ICharacterItem extends IBaseStageItem {
  name: 'character'
  'data-chara-type': 'actor' | 'npc'
  'data-chara-id': string
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

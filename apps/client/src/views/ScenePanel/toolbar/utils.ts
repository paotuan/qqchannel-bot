// 所有基础图形
export const basicShapes = ['circle', 'rect', 'polygon', 'wedge', 'star', 'arrow'] as const

export type BasicShape = typeof basicShapes[number]

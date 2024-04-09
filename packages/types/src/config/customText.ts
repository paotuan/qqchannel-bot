import { IPluginElementCommonInfo } from './utils'

export interface ICustomTextItem {
  weight: number
  text: string
}

export type ICustomTextHandler = (env: Record<string, any>) => string

export type CustomTextKeys =
  | 'roll.start'
  | 'roll.inline.first'
  | 'roll.inline.middle'
  | 'roll.inline.last'
  | 'roll.result'
  | 'roll.result.quiet'
  | 'roll.hidden'
  | 'test.worst'
  | 'test.best'
  | 'test.fail'
  | 'test.exsuccess'
  | 'test.hardsuccess'
  | 'test.success'
  | 'roll.vs.prompt'
  | 'roll.vs.result'
  | 'roll.ds.best'
  | 'roll.ds.worst'
  | 'roll.ds.tostable'
  | 'roll.ds.todeath'
  | 'roll.en.empty'
  | 'roll.en.list'
  | 'roll.en.extra'
  | 'roll.en.mark'
  | 'roll.en.markclear'
  | 'roll.ri.unsupported'
  | 'roll.ri.del'
  | 'roll.ri.clear'
  | 'roll.sc.unsupported'
  | 'roll.sc.extra'
  | 'card.empty'
  | 'card.nopermission'
  | 'roll.st.prompt'
  | 'roll.st.show'
  | 'roll.st.set'
  | 'nn.show'
  | 'nn.link'
  | 'nn.clear'
  | 'nn.search'

export interface ICustomTextConfig extends IPluginElementCommonInfo {
  texts: Partial<Record<CustomTextKeys, ICustomTextItem[] | ICustomTextHandler>>
}

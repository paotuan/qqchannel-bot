import { ICard } from './index'

export interface IGeneralCardData {
  type: 'general'
  version: number
  id: string
  name: string
  ext: string
  skills: Record<string, number>
  abilities: Record<string, string>
}

export class GeneralCard implements ICard {
  private data: IGeneralCardData

  get type() {
    return this.data.type
  }

  get version() {
    return this.data.version
  }

  constructor(data: IGeneralCardData) {
    this.data = data
  }

  getAbility(expression: string) {
    return undefined
  }

  setAbility(name: string, value: string) {
  }

  removeAbility(name: string) {
  }

  getEntry(expression: string) {
    return undefined
  }

  setEntry(name: string, value: number) {
  }

  removeEntry(name: string) {
  }
}

import type { ICard } from './index'

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
  private readonly data: IGeneralCardData

  get type() {
    return this.data.type
  }

  get version() {
    return this.data.version
  }

  get id() {
    return this.data.id
  }

  get name() {
    return this.data.name
  }

  get hp() {
    return this.getEntry('HP')?.value
  }

  get maxHp() {
    return this.getEntry('MAXHP')?.value
  }

  constructor(data: IGeneralCardData) {
    this.data = data
  }

  getAbility(input: string) {
    const key = input.toUpperCase()
    const value = this.data.abilities[key]
    if (typeof value !== 'undefined') {
      return { input, key, value }
    } else {
      return undefined
    }
  }

  setAbility(name: string, value: string) {
    this.data.abilities[name.toUpperCase()] = value
    return true
  }

  removeAbility(name: string) {
    const key = name.toUpperCase()
    if (typeof this.data.abilities[key] !== 'undefined') {
      delete this.data.abilities[key]
      return true
    } else {
      return false
    }
  }

  getEntry(input: string) {
    const key = input.toUpperCase()
    const value = this.data.skills[key]
    if (typeof value !== 'undefined') {
      return { input, key, value, isTemp: false }
    } else {
      return undefined
    }
  }

  setEntry(name: string, value: number) {
    this.data.skills[name.toUpperCase()] = value
    return true
  }

  removeEntry(name: string) {
    const key = name.toUpperCase()
    if (typeof this.data.skills[key] !== 'undefined') {
      delete this.data.skills[key]
      return true
    } else {
      return false
    }
  }
}

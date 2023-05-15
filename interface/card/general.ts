import type { ICardData } from './types'
import { BaseCard } from './types'

export interface IGeneralCardData extends ICardData {
  type: 'general'
  ext: string
  skills: Record<string, number>
  abilities: { key: string, value: string }[]
}

export class GeneralCard extends BaseCard<IGeneralCardData> {
  get HP() {
    return this.getEntry('HP')?.value
  }

  get MAXHP() {
    return this.getEntry('MAXHP')?.value
  }

  getAbility(input: string) {
    const key = input.toUpperCase()
    const ability = this.data.abilities.find(item => item.key.toUpperCase() === key)
    if (ability) {
      return { input, key: ability.key, value: ability.value }
    }
    return undefined
  }

  setAbility(name: string, value: string) {
    const abilityRet = this.getAbility(name)
    if (abilityRet) {
      const ability = this.data.abilities.find(item => item.key === abilityRet.key)!
      if (ability.value !== value) {
        ability.value = value
        this.data.lastModified = Date.now()
        return true
      } else {
        return false
      }
    } else {
      this.data.abilities.push({ key: name, value })
      this.data.lastModified = Date.now()
      return true
    }
  }

  removeAbility(name: string) {
    const abilityRet = this.getAbility(name)
    if (abilityRet) {
      const index = this.data.abilities.findIndex(item => item.key === abilityRet.key)
      if (index >= 0) { // must
        this.data.abilities.splice(index, 1)
        this.data.lastModified = Date.now()
        return true
      }
    }
    return false
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
    const key = name.toUpperCase()
    if (this.data.skills[key] !== value) {
      this.data.skills[key] = value
      this.data.lastModified = Date.now()
      return true
    }
    return false
  }

  removeEntry(name: string) {
    const key = name.toUpperCase()
    if (typeof this.data.skills[key] !== 'undefined') {
      delete this.data.skills[key]
      this.data.lastModified = Date.now()
      return true
    } else {
      return false
    }
  }

  getSummary() {
    const skills = Object.entries(this.data.skills).map(([k ,v]) => `${k}：${v}`).join(' ')
    const abilities = Object.entries(this.data.abilities).map(([k ,v]) => `${k}：${v}`).join('\n')
    return '角色：' + this.name + '\n' + skills + '\n' + abilities
  }
}

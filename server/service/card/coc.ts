import type { ICard } from '../../../interface/common'
import { makeAutoObservable } from 'mobx'

type Difficulty = 'normal' | 'hard' | 'ex'

export interface ICocCardEntry {
  expression: string
  name: string // basic or prop or skill
  difficulty: Difficulty
  value: number
}

export class CocCard {
  data: ICard

  constructor(data: ICard) {
    makeAutoObservable(this)
    this.data = data
  }

  // raw, propOrSkill, difficulty, value
  getEntry(expression: string) {
    const card = this.data
    let skill = expression
    let target: number | undefined
    let difficulty: Difficulty = 'normal'
    if (skill === '理智' || skill === 'sc' || skill === 'SC') {
      target = card.basic.san
    } else if (skill === '幸运') {
      target = card.basic.luck
    } else if (skill === '灵感') {
      target = card.props['智力']
    } else {
      // 其他的属性或技能有困难等级
      if (skill.indexOf('困难') >= 0) {
        difficulty = 'hard'
      } else if (skill.indexOf('极难') >= 0 || skill.indexOf('极限') >= 0) {
        difficulty = 'ex'
      }
      skill = skill.replace(/(困难|极难|极限)/g, '')
      // 通用获取数值
      target = this.getTargetValue(skill)?.[0]
      if (typeof target === 'number') {
        if (difficulty === 'hard') {
          target = Math.floor(target / 2)
        } else if (difficulty === 'ex') {
          target = Math.floor(target / 5)
        }
      }
    }
    // return
    if (typeof target !== 'undefined') {
      return { expression, name: skill, difficulty, value: target } as ICocCardEntry
    } else {
      return null
    }
  }

  private getTargetValue(skill: string) {
    const card = this.data
    const possibleSkills = skillAliasMap[skill] ?? [skill] // 处理属性别名
    for (const skill of possibleSkills) {
      const target = card.basic[skill as keyof ICard['basic']] || card.props[skill as keyof ICard['props']] || card.skills[skill]
      if (typeof target === 'number') {
        return [target, skill] as [number, string] // 返回真实存在的那个别名
      }
    }
    return undefined
  }

  setEntry(name: string, value: number) {
    // todo
  }
}

const skillAlias = [
  ['侦查', '侦察'],
  ['hp', 'HP'],
  ['mp', 'MP', '魔法']
]

const skillAliasMap: Record<string, string[]> = skillAlias
  .map(line => line.reduce((obj, str) => Object.assign(obj, { [str]: line }), {}))
  .reduce((total, obj) => Object.assign(total, obj), {})

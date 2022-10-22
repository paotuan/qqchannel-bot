import type { ICard } from '../../../interface/common'
import { makeAutoObservable } from 'mobx'

type Difficulty = 'normal' | 'hard' | 'ex'
type EntryType = 'basic' | 'props' | 'skills'

export interface ICocCardEntry {
  expression: string // 原始表达式
  type: EntryType
  name: string
  difficulty: Difficulty
  value: number
}

export class CocCard {
  data: ICard

  constructor(data: ICard) {
    makeAutoObservable(this)
    this.data = data
  }

  getEntry(expression: string) {
    const [skillWithoutDifficulty, difficulty] = parseDifficulty(expression)
    const target = this.getTargetValue(skillWithoutDifficulty)
    if (target) {
      const value = (() => {
        if (difficulty === 'hard') {
          return Math.floor(target.value / 2)
        } else if (difficulty === 'ex') {
          return Math.floor(target.value / 5)
        } else {
          return target.value
        }
      })()
      return { expression, type: target.type, name: target.name, difficulty, value } as ICocCardEntry
    } else {
      return null
    }
  }

  private getTargetValue(rawSkillName: string) {
    const card = this.data as any
    const possibleSkills = skillAliasMap[rawSkillName] ?? [rawSkillName] // 处理属性别名
    for (const skill of possibleSkills) {
      for (const type of ['basic', 'props', 'skills']) {
        const target = card[type][skill]
        if (typeof target === 'number') {
          return { value: target, name: skill, type } // 返回真实存在的那个别名
        }
      }
    }
    return undefined
  }

  setEntry(rawName: string, value: number) {
    // 判断是否有现成的 entry
    const target = this.getTargetValue(rawName)
    if (target) {
      if (value === target.value) {
        return false // 值相等，避免无用的更新
      } else {
        const card = this.data as any
        card[target.type][target.name] = value
        this.data.meta.lastModified = Date.now()
        return true
      }
    } else {
      // 没有现成的，认为是 skill
      this.data.skills[rawName] = value
      this.data.meta.lastModified = Date.now()
      return true
    }
  }

  markSkillGrowth(skill: string) {
    if (this.data.meta.skillGrowth[skill]) {
      return false // 已经标记为成长了，无需额外的更新
    } else {
      console.log('[COC] 标记技能成长', skill)
      this.data.meta.skillGrowth[skill] = true
      this.data.meta.lastModified = Date.now()
      // todo 异步保存(保存要不要放在这里？因为可能会有批量操作，不能放这里)
      return true // 返回有更新
    }
  }
}

const skillAlias = [
  // region 建议不要改
  ['力量', 'str', 'STR'],
  ['敏捷', 'dex', 'DEX'],
  ['意志', 'pow', 'POW'],
  ['体质', 'con', 'CON'],
  ['外貌', 'app', 'APP'],
  ['教育', 'edu', 'EDU'],
  ['体型', 'siz', 'SIZ', 'size', 'SIZE'],
  ['智力', '灵感', 'int', 'INT'],
  ['生命', 'hp', 'HP'],
  ['理智', 'san', 'sc', 'SC', 'SAN'],
  ['魔法', 'mp', 'MP'],
  ['幸运', 'luck', 'luk', 'LUK'],
  ['侦查', '侦察'],
  // endregion
  ['计算机', '计算机使用', '电脑'],
  ['信用', '信誉', '信用评级'],
  ['克苏鲁', '克苏鲁神话'],
  ['图书馆', '图书馆使用']
]

const skillAliasMap: Record<string, string[]> = skillAlias
  .map(line => line.reduce((obj, str) => Object.assign(obj, { [str]: line }), {}))
  .reduce((total, obj) => Object.assign(total, obj), {})

function parseDifficulty(expression: string) {
  let difficulty: Difficulty = 'normal'
  if (expression.includes('困难')) {
    difficulty = 'hard'
  } else if (expression.includes('极难') || expression.includes('极限')) {
    difficulty = 'ex'
  }
  expression = expression.replace(/(困难|极难|极限)/g, '')
  return [expression, difficulty]
}

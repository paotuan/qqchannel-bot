import type { ICard } from '../../../interface/coc'
import { makeAutoObservable } from 'mobx'
import { getDBAndBuild, skillAliasMap } from '../../../interface/coc'

type Difficulty = 'normal' | 'hard' | 'ex'
type EntryType = 'basic' | 'props' | 'skills'

export interface ICocCardEntry {
  expression: string // 原始表达式
  type: EntryType // 字段类型
  name: string // 字段名
  difficulty: Difficulty // 难度
  value: number // 该难度下成功的数值
  baseValue: number // 该字段原始数值（不计难度）
  isTemp: boolean // 是否是临时数值
}

export interface ICocCardAbility {
  expression: string // 原始表达式
  type: 'ability'
  name: string // macro 字段名
  value: string // macro 对应的值
  // entry?: ICocCardEntry | null // 是否对应了某个技能 // 暂不做，增加额外复杂度且并不完全通用
}

export class CocCard {
  data: ICard

  constructor(data: ICard) {
    makeAutoObservable(this)
    this.data = data
  }

  get dbAndBuild() {
    return getDBAndBuild(this.data)
  }

  getAbility(expression: string) {
    // const [name, difficulty] = parseDifficulty(expression)
    const name = expression
    if (name === '手枪') {
      const value = '1d3+$db' // todo mock
      // todo 反正解析的逻辑差不多，如果拿不到 ability 直接拿 entry 如何。算了，先冗余一点，保险
      return { expression, type: 'ability', name, value } as ICocCardAbility
    } else if (name === '拉拉') {
      const value = '$手枪+1'
      return { expression, type: 'ability', name, value } as ICocCardAbility
    } else {
      return null
    }
  }

  getEntry(expression: string) {
    const [skillWithoutDifficulty, difficulty] = parseDifficulty(expression)
    const target = this.getTargetValue(skillWithoutDifficulty)
    if (target) {
      const value = calculateTargetValueWithDifficulty(target.value, difficulty)
      return { expression, type: target.type, name: target.name, difficulty, value, baseValue: target.value, isTemp: false } as ICocCardEntry
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
    // todo log
    // todo 特殊：增加克苏鲁神话要减去理智
  }

  markSkillGrowth(skill: string) {
    // 克苏鲁和信用评级不能成长
    const possibleSkills = skillAliasMap[skill] ?? [skill]
    if (possibleSkills.includes('克苏鲁') || possibleSkills.includes('信用')) {
      return false
    }
    if (this.data.meta.skillGrowth[skill]) {
      return false // 已经标记为成长了，无需额外的更新
    } else {
      console.log('[COC] 标记技能成长', skill)
      this.data.meta.skillGrowth[skill] = true
      this.data.meta.lastModified = Date.now()
      return true // 返回有更新
    }
  }

  cancelSkillGrowth(skill: string) {
    let updated = false
    const possibleSkills = skillAliasMap[skill] ?? [skill]
    possibleSkills.forEach(skill => {
      if (this.data.meta.skillGrowth[skill]) {
        delete this.data.meta.skillGrowth[skill]
        updated = true
      }
    })
    return updated
  }
}

export function parseDifficulty(expression: string): [string, Difficulty] {
  let difficulty: Difficulty = 'normal'
  if (expression.includes('困难')) {
    difficulty = 'hard'
  } else if (expression.includes('极难') || expression.includes('极限')) {
    difficulty = 'ex'
  }
  expression = expression.replace(/(困难|极难|极限)/g, '')
  return [expression, difficulty]
}

export function calculateTargetValueWithDifficulty(normalValue: number, difficulty: Difficulty) {
  if (difficulty === 'hard') {
    return Math.floor(normalValue / 2)
  } else if (difficulty === 'ex') {
    return Math.floor(normalValue / 5)
  } else {
    return normalValue
  }
}

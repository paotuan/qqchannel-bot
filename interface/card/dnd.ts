import type { ICardAbility, ICardData, ICardEntry } from './types'
import { BaseCard } from './types'

export type EntryType = 'basic' | 'props' | 'skills' | 'items'
export type AbilityType = 'equips' | 'spells'
export type PostfixType = 'none' | 'modifier' | 'saving' // 属性值 | 调整值 | 豁免

export interface IDndCardData extends ICardData {
  type: 'dnd',
  info: {
    job: string
    gender: string
    age: number
    race: string // 种族
    camp: string // 阵营
  },
  basic: {
    EXP: number
    LV: number
    '熟练': number
    HP: number
    MAXHP: number
    AC: number // 护甲
  },
  props: {
    '力量': number
    '敏捷': number
    '体质': number
    '智力': number
    '感知': number
    '魅力': number
  },
  skills: {
    '运动': number
    '体操': number
    '巧手': number
    '隐匿': number
    '奥秘': number
    '历史': number
    '调查': number
    '自然': number
    '宗教': number
    '驯兽': number
    '洞悉': number
    '医疗': number
    '察觉': number
    '生存': number
    '欺瞒': number
    '威吓': number
    '表演': number
    '说服': number
  },
  items: {
    CP: number // 铜币
    SP: number // 银币
    GP: number // 金币
    EP: number // 银金币
    PP: number // 铂金币
    [key: string]: number // 其他任何 item
  },
  equips: {
    name: string
    expression: string
    ext: string
  }[],
  spells: {
    name: string
    expression: string
    ext: string
  }[],
  ext: string
  meta: {
    // 法术位
    spellSlots: {
      [ring: number]: { value: number, max: number }
    },
    // 死亡豁免
    deathSaving: {
      success: number
      failure: number
    },
    // 豁免检定熟练项 todo 废弃
    // propsSaving: {
    //   '力量': boolean
    //   '敏捷': boolean
    //   '体质': boolean
    //   '智力': boolean
    //   '感知': boolean
    //   '魅力': boolean
    // },
    experienced: Record<string, boolean>
  }
}

export interface IDndCardEntry extends ICardEntry {
  type: EntryType
  postfix: PostfixType
}

export interface IDndCardAbility extends ICardAbility {
  type: AbilityType
}

/**
 * DND 人物卡
 */
export class DndCard extends BaseCard<IDndCardData, IDndCardEntry, IDndCardAbility> {
  readonly defaultRoll = 'd20'
  readonly riDefaultRoll = 'd20+$敏捷调整'

  get HP() {
    return this.data.basic.HP
  }

  set HP(value) {
    this.data.basic.HP = clamp(value, 0, this.MAXHP)
  }

  get MAXHP() {
    return this.data.basic.MAXHP
  }

  override getAbility(input: string): IDndCardAbility | undefined {
    const _input = input.toUpperCase()
    // 获取所有可能的别名
    const possibleNames = SKILL_ALIAS[_input] ?? [_input]
    for (const key of possibleNames) {
      for (const type of ['spells', 'equips'] as const) {
        const ability = this.data[type].find(item => item.name.toUpperCase() === key)
        if (ability) {
          return { input, key: ability.name, value: ability.expression, type }
        }
      }
    }
    return undefined
  }

  override setAbility(name: string, expression: string): boolean {
    const abilityRet = this.getAbility(name)
    if (abilityRet) {
      // 非 readonly 情况，key 和 name 严格相等了，所以可以直接 find
      const ability = this.data[abilityRet.type].find(item => item.name === abilityRet.key)!
      if (ability.expression !== expression) {
        ability.expression = expression
        this.data.lastModified = Date.now()
        return true
      } else {
        return false
      }
    } else {
      this.data.equips.push({ name, expression, ext: '' }) // 默认放 equips 分类
      this.data.lastModified = Date.now()
      return true
    }
  }

  override removeAbility(name: string): boolean {
    const abilityRet = this.getAbility(name)
    if (abilityRet) {
      const index = this.data[abilityRet.type].findIndex(item => item.name === abilityRet.key)
      if (index >= 0) { // must
        this.data[abilityRet.type].splice(index, 1)
        this.data.lastModified = Date.now()
        return true
      }
    }
    return false
  }

  private getValueByPostfix(type: EntryType, key: string, value: number, postfix: PostfixType) {
    if (type === 'props') {
      if (postfix === 'modifier') {
        return calculatePropModifier(value) // 属性调整
      } else if (postfix === 'saving') {
        const experienced = !!this.data.meta.experienced[key]
        return calculatePropModifier(value) + (experienced ? this.data.basic.熟练 : 0) // 属性豁免
      }
    }
    return value
  }

  override getEntry(input: string): IDndCardEntry | undefined {
    const [skillName, postfix] = parseInput(input)
    if (!skillName) return undefined
    const _input = skillName.toUpperCase()
    const possibleSkills = SKILL_ALIAS[_input] ?? [_input] // 获取所有可能的属性/技能别名
    // 遍历尝试获取
    for (const key of possibleSkills) {
      for (const type of ['basic', 'props', 'skills', 'items'] as const) {
        const target = (this.data[type] as Record<string, number>)[key]
        if (typeof target === 'number') {
          // 是否需要根据 postfix 计算
          const value = this.getValueByPostfix(type, key, target, postfix)
          return { input, key, value, isTemp: false, type, postfix }
        }
      }
    }
    return undefined
  }

  override setEntry(name: string, value: number): boolean {
    const [skillName, postfix] = parseInput(name)
    if (!skillName) return false
    if (postfix !== 'none') return false // 有特殊后缀的也不处理吧
    // 是否是特殊 setter
    const _input = skillName.toUpperCase()
    const possibleSkills = SKILL_ALIAS[_input] ?? [_input] // 获取所有可能的属性/技能别名
    for (const key of possibleSkills) {
      const keyAsSpecialSetters = key as typeof SPECIAL_ENTRY_SETTERS[number]
      if (SPECIAL_ENTRY_SETTERS.includes(keyAsSpecialSetters)) {
        const oldValue = this[keyAsSpecialSetters]
        this[keyAsSpecialSetters] = value
        const newValue = this[keyAsSpecialSetters]
        // 判断是否是真的改变了，因为可能被 setter 拦下来，实际未改变
        if (oldValue !== newValue) {
          this.data.lastModified = Date.now()
          return true
        } else {
          return false
        }
      }
    }
    // 是否已有条目
    const entry = this.getEntry(name)
    if (entry) {
      if (value !== entry.value) {
        (this.data[entry.type] as Record<string, number>)[entry.key] = value
        this.data.lastModified = Date.now()
        return true
      } else {
        return false
      }
    } else {
      // 新增条目，认为是 items，且统一大写
      this.data.items[_input] = value
      this.data.lastModified = Date.now()
      return true
    }
  }

  override removeEntry(name: string): boolean {
    const [skillName, postfix] = parseInput(name)
    if (!skillName) return false
    if (postfix !== 'none') return false // 有特殊后缀的也不处理吧
    const entry = this.getEntry(name)
    if (entry && entry.type === 'items' && !['CP', 'SP', 'GP', 'EP', 'PP'].includes(entry.key)) {
      delete this.data.items[entry.key]
      this.data.lastModified = Date.now()
      return true
    } else {
      return false
    }
  }

  /**
   * 标记属性/技能熟练
   */
  markExperienced(skill: string) {
    const entry = this.getEntry(skill)
    if (!entry || !['props', 'skills'].includes(entry.type)) return false // 没这个技能，或技能不能成长
    const key = entry.key
    if (this.data.meta.experienced[key]) {
      return false
    } else {
      this.data.meta.experienced[key] = true
      this.data.lastModified = Date.now()
      return true // 返回有更新
    }
  }

  /**
   * 取消属性/技能熟练
   */
  cancelExperienced(skill: string) {
    let updated = false
    const _input = skill.toUpperCase()
    const possibleSkills = SKILL_ALIAS[_input] ?? [_input]
    possibleSkills.forEach(skill => { // 把所有的别名都干掉
      if (this.data.meta.experienced[skill]) {
        delete this.data.meta.experienced[skill]
        updated = true
      }
    })
    return updated
  }

  override getSummary(): string {
    const basic = [
      `生命：${this.HP}/${this.MAXHP}`,
      `LV：${this.data.basic.LV}`,
      `AC：${this.data.basic.AC}`
    ].join(' ')
    const props = Object.entries(this.data.props).map(([k ,v]) => `${k}：${v}`).join(' ')
    const skills = Object.entries(this.data.skills).map(([k ,v]) => `${k}：${v}`).join(' ')
    const items = Object.entries(this.data.items).map(([k ,v]) => `${k}：${v}`).join(' ')
    return '角色：' + this.name + '\n' + basic + '\n' + props + '\n' + skills + '\n' + items
  }
}

/**
 * DND 计算属性表
 */
// 具有特殊 setter 的数值，须确保作为 setter 出现
const SPECIAL_ENTRY_SETTERS = ['HP'] as const

/**
 * DND 技能对应的属性表
 */
const _PROP2SKILLS = Object.freeze({
  '力量': ['运动'],
  '敏捷': ['体操', '巧手', '隐匿'],
  '智力': ['奥秘', '历史', '调查', '自然', '宗教'],
  '感知': ['驯兽', '洞悉', '医疗', '察觉', '生存'],
  '魅力': ['欺瞒', '威吓', '表演', '说服']
})

const _SKILL2PROP = (() => {
  const ret: Record<string, string> = {}
  Object.keys(_PROP2SKILLS).forEach(prop => {
    const skills = _PROP2SKILLS[prop as keyof typeof _PROP2SKILLS]
    skills.forEach(skill => {
      ret[skill] = prop
    })
  })
  return ret
})()

// 获取 skill 的 prop。此方法不考虑同义词的问题
export function getPropOfSkill(skill: string) {
  return _SKILL2PROP[skill]
}

/**
 * DND 同义词表
 */
const _SKILL_ALIAS = Object.freeze([
  ['力量', 'STR'],
  ['敏捷', 'DEX'],
  ['体质', 'CON'],
  ['智力', 'INT'],
  ['感知', 'WIS'],
  ['魅力', 'CHA'],
  ['EXP', 'XP', '经验', '经验值'],
  ['LV', 'LEVEL', '等级'],
  ['生命', 'HP', '生命值'],
  ['生命上限', 'MAXHP', 'HPMAX', '生命值上限'],
  ['AC', '护甲'],
  ['铜币', 'CP'],
  ['银币', 'SP'],
  ['金币', 'GP'],
  ['银金币', 'EP'],
  ['铂金币', 'PP'],
  ['说服', '游说'],
  ['医疗', '医药']
])

const SKILL_ALIAS: Record<string, string[]> = _SKILL_ALIAS
  .map(line => line.reduce((obj, str) => Object.assign(obj, { [str]: line }), {}))
  .reduce((total, obj) => Object.assign(total, obj), {})

function parseInput(expression: string): [string, PostfixType] {
  let type: PostfixType = 'none'
  if (expression.endsWith('调整') || expression.endsWith('调整值')) {
    type = 'modifier'
  } else if (expression.endsWith('豁免')) {
    type = 'saving'
  }
  expression = expression.replace(/(调整值|调整|豁免)$/g, '')
  return [expression.trim(), type]
}

// 根据属性值计算调整值
function calculatePropModifier(value: number) {
  return Math.floor(value / 2) - 5
}

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

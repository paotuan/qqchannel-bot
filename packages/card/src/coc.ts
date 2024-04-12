import type { ICardAbility, ICardData, ICardEntry } from './types'
import { BaseCard } from './types'

export type EntryType = 'basic' | 'props' | 'skills'
export type Difficulty = 'normal' | 'hard' | 'ex'

/**
 * coc 人物卡定义
 */
export interface ICocCardData extends ICardData {
  type: 'coc'
  basic: {
    job: string
    gender: string
    AGE: number
    HP: number
    SAN: number
    LUCK: number
    MP: number
    CM: number
    '信用': number
  },
  props: {
    '力量': number
    '体质': number
    '体型': number
    '敏捷': number
    '外貌': number
    '智力': number
    '意志': number
    '教育': number
  },
  skills: Record<string, number>,
  abilities: {
    name: string
    expression: string
    ext: string
  }[],
  ext: string
  meta: {
    skillGrowth: Record<string, boolean>
  }
}

export interface ICocCardEntry extends ICardEntry {
  type: EntryType // entry 类型，主要用于判断是否能技能成长（一般来说 basic 和 props 不能成长）
  difficulty: Difficulty // 难度
  baseValue: number // 该字段原始数值（不计难度）
  readonly: boolean // 是否只读
}

// 内部使用，获取除难度的中间结果
type ICocCardEntryRaw = Omit<ICocCardEntry, 'difficulty' | 'value'>

export interface ICocCardAbility extends ICardAbility {
  readonly: boolean // 是否只读
}

/**
 * coc 人物卡
 */
export class CocCard extends BaseCard<ICocCardData, ICocCardEntry, ICocCardAbility> {
  readonly defaultRoll = 'd%'
  readonly riDefaultRoll = '$敏捷'

  get HP() {
    return this.data.basic.HP
  }

  set HP(value) {
    this.data.basic.HP = clamp(value, 0, this.MAXHP)
  }

  get MAXHP() {
    return Math.floor((this.data.props.体质 + this.data.props.体型) / 10)
  }

  get MP() {
    return this.data.basic.MP
  }

  set MP(value) {
    this.data.basic.MP = clamp(value, 0, this.MAXMP)
  }

  get MAXMP() {
    return Math.floor(this.data.props.意志 / 5)
  }

  get SAN() {
    return this.data.basic.SAN
  }

  set SAN(value) {
    this.data.basic.SAN = clamp(value, 0, this.MAXSAN)
  }

  get MAXSAN() {
    return Math.max(0, 99 - this.data.basic.CM)
  }

  get CM() {
    return this.data.basic.CM
  }

  set CM(value) {
    // 增加克苏鲁神话，控制理智值不能超出上限
    this.data.basic.CM = value
    this.SAN = Math.min(this.SAN, this.MAXSAN)
  }

  // 计算伤害加值和体格
  private get dbAndBuild(): [string, number] {
    const sum = this.data.props.力量 + this.data.props.体型 // str+siz
    if (sum < 65) {
      return ['-2', -2]
    } else if (sum < 85) {
      return ['-1', -1]
    } else if (sum < 125) {
      return ['0', 0]
    } else if (sum < 165) {
      return ['1d4', 1]
    } else if (sum < 205) {
      return ['1d6', 2]
    } else {
      const extra = Math.floor((sum - 205) / 80)
      return [`${2 + extra}d6`, 3 + extra]
    }
  }

  get DB() {
    return this.dbAndBuild[0]
  }

  get 体格() {
    return this.dbAndBuild[1]
  }

  override getAbility(input: string) {
    // 获取所有可能的别名
    const possibleNames = this.getAliases(input)
    // 是否从配置表里找得到这个 ability
    for (const key of possibleNames) {
      const ability = this.data.abilities.find(item => item.name.toUpperCase() === key)
      if (ability) {
        return { input, key: ability.name, value: ability.expression, readonly: false }
      }
    }
    // 是否是特殊的 computed abilities
    for (const key of possibleNames) {
      const keyAsComputedAbilities = key as typeof COMPUTED_ABILITIES[number]
      if (COMPUTED_ABILITIES.includes(keyAsComputedAbilities)) {
        return { input, key, value: this[keyAsComputedAbilities], readonly: true }
      }
    }
    return undefined
  }

  override setAbility(name: string, expression: string) {
    const abilityRet = this.getAbility(name)
    if (abilityRet && !abilityRet.readonly) { // 允许用户输入同名的 ability 覆盖系统内置的
      // 非 readonly 情况，key 和 name 严格相等了，所以可以直接 find
      const ability = this.data.abilities.find(item => item.name === abilityRet.key)!
      if (ability.expression !== expression) {
        ability.expression = expression
        this.data.lastModified = Date.now()
        return true
      } else {
        return false
      }
    } else {
      this.data.abilities.push({ name, expression, ext: '' })
      this.data.lastModified = Date.now()
      return true
    }
  }

  override removeAbility(name: string) {
    const abilityRet = this.getAbility(name)
    if (abilityRet && !abilityRet.readonly) {
      const index = this.data.abilities.findIndex(item => item.name === abilityRet.key)
      if (index >= 0) { // must
        this.data.abilities.splice(index, 1)
        this.data.lastModified = Date.now()
        return true
      }
    }
    return false
  }

  // 不包含困难前缀的获取
  private getRawEntry(input: string): ICocCardEntryRaw | undefined {
    const possibleSkills = this.getAliases(input) // 获取所有可能的属性/技能别名
    // 遍历 basic，props 和 skills 尝试获取. 先判断 skills，因为可能有用户输入同名属性，优先级更高
    for (const key of possibleSkills) {
      for (const type of ['skills', 'basic', 'props'] as const) {
        const target = (this.data[type] as Record<string, number | string>)[key]
        if (typeof target === 'number') {
          return { input, key, baseValue: target, isTemp: false, readonly: false, type } // 返回真实存在的那个别名
        }
      }
    }
    // 是否是特殊的 computed skills
    for (const key of possibleSkills) {
      const keyAsComputedEntries = key as typeof COMPUTED_ENTRIES[number]
      if (COMPUTED_ENTRIES.includes(keyAsComputedEntries)) {
        return { input, key, baseValue: this[keyAsComputedEntries], isTemp: false, readonly: true, type: 'basic' }
      }
    }
    return undefined
  }

  override getEntry(input: string) {
    const [skillWithoutDifficulty, difficulty] = parseDifficulty(input)
    if (!skillWithoutDifficulty) return undefined
    const target = this.getRawEntry(skillWithoutDifficulty)
    if (target) {
      const value = calculateTargetValueWithDifficulty(target.baseValue, difficulty)
      return { ...target, value, difficulty }
    } else {
      return undefined
    }
  }

  override setEntry(name: string, value: number) {
    const [skillWithoutDifficulty, difficulty] = parseDifficulty(name)
    if (!skillWithoutDifficulty) return false
    const _input = skillWithoutDifficulty.toUpperCase()
    const rawEntry = this.getRawEntry(skillWithoutDifficulty)
    // 是否是特殊的 setter，不直接调用 data，而是通过 setter 修改
    if (rawEntry && rawEntry.type === 'basic') { // 所有的特殊 setter 都是 basic。而用户覆盖的话 type 是 skill，因此可以区分
      const keyAsSpecialSetters = rawEntry.key as typeof SPECIAL_ENTRY_SETTERS[number]
      if (SPECIAL_ENTRY_SETTERS.includes(keyAsSpecialSetters)) {
        const oldValue = this[keyAsSpecialSetters]
        this[keyAsSpecialSetters] = value
        const newValue = this[keyAsSpecialSetters]
        // 判断是否是真的改变了，因为可能被 setter 拦下来，实际未改变
        if (oldValue !== newValue) {
          this.data.lastModified = Date.now()
          this.emitCardEntryChange(rawEntry.key, newValue, oldValue)
          return true
        } else {
          return false
        }
      }
    }
    // 是否已有条目
    const targetValue = calculateTargetValueWithDifficulty(value, difficulty, true)
    if (rawEntry && !rawEntry.readonly) {
      if (targetValue !== rawEntry.baseValue) {
        const oldValue = rawEntry.baseValue
        ;(this.data[rawEntry.type] as Record<string, number>)[rawEntry.key] = targetValue
        this.data.lastModified = Date.now()
        this.emitCardEntryChange(rawEntry.key, targetValue, oldValue)
        return true
      } else {
        return false
      }
    } else {
      // 新增条目，认为是 skill，且统一大写
      this.data.skills[_input] = targetValue
      this.data.lastModified = Date.now()
      this.emitCardEntryChange(_input, targetValue, undefined)
      return true
    }
  }

  override removeEntry(name: string) {
    const [skillWithoutDifficulty] = parseDifficulty(name)
    if (!skillWithoutDifficulty) return false
    const entry = this.getRawEntry(skillWithoutDifficulty)
    if (entry && entry.type === 'skills' && !entry.readonly) {
      const oldValue = entry.baseValue
      delete this.data.skills[entry.key]
      this.data.lastModified = Date.now()
      this.emitCardEntryChange(entry.key, undefined, oldValue)
      return true
    } else {
      return false
    }
  }

  /**
   * 标记技能成长
   */
  markSkillGrowth(skill: string) {
    const entry = this.getRawEntry(skill)
    if (!entry || entry.type !== 'skills') return false // 没这个技能，或技能不能成长
    const key = entry.key
    if (this.data.meta.skillGrowth[key]) {
      return false // 已经标记为成长了，无需额外的更新
    } else {
      this.data.meta.skillGrowth[key] = true
      this.data.lastModified = Date.now()
      return true // 返回有更新
    }
  }

  /**
   * 取消技能成长
   */
  cancelSkillGrowth(skill: string) {
    let updated = false
    const possibleSkills = this.getAliases(skill)
    possibleSkills.forEach(skill => { // 把所有的别名都干掉
      if (this.data.meta.skillGrowth[skill]) {
        delete this.data.meta.skillGrowth[skill]
        updated = true
      }
    })
    return updated
  }

  /**
   * 清除所有技能成长标记
   */
  clearSkillGrowth() {
    const count = Object.keys(this.data.meta.skillGrowth).length
    this.data.meta.skillGrowth = {}
    return count > 0
  }

  /**
   * 如果人物卡未设置一些值，则以默认值填充
   */
  applyDefaultValues() {
    // 初始血量等值
    if (!this.HP) this.HP = this.MAXHP
    if (!this.MP) this.MP = this.MAXMP
    if (!this.SAN) this.SAN = this.data.props.意志
    // 初始技能值
    Object.entries(DEFAULT_SKILLS).forEach(([key, value]) => {
      const entry = this.getRawEntry(key)
      if (!entry) {
        // this.setEntry(key, value)
        // 都是 skills 且不存在，直接快速赋值了
        this.data.skills[key] = value
      }
    })
    // 闪避
    const shanbiEntry = this.getRawEntry('闪避')
    if (!shanbiEntry) {
      this.data.skills['闪避'] = Math.floor(this.data.props.敏捷 / 2)
    }
    // 母语
    const muyuEntry = this.getRawEntry('母语')
    if (!muyuEntry) {
      this.data.skills['母语'] = this.data.props.教育
    }
    this.data.lastModified = Date.now() // 强制认为有更新吧
  }

  override getEntryDisplay(name: string): string {
    const entry = this.getEntry(name)
    if (entry) {
      const isSkillGrowth = (entry && entry.type === 'skills' && this.data.meta.skillGrowth[entry.key]) // 是否有技能成长标记
      return `${name}${isSkillGrowth ? '*' : ''}:${entry.value}`
    }
    const ability = this.getAbility(name)
    if (ability) {
      return `${name}:${ability.value}`
    }
    return `${name}:-`
  }

  override getSummary() {
    const _ = (name: string) => this.getEntry(name)?.value ?? '-' // 基础属性还是走 getEntry，以防用户覆盖基础属性
    const basic = [
      `生命:${_('HP')}/${_('MAXHP')}`,
      `理智:${_('SAN')}/${_('MAXSAN')}`,
      `幸运:${_('LUCK')}`,
      `魔法:${_('MP')}/${_('MAXMP')}`,
      `克苏鲁神话:${_('CM')}`,
      `信用评级:${_('信用')}`
    ].join(' ')
    const props = Object.entries(this.data.props).map(([k ,v]) => `${k}:${v}`).join(' ') // 理论上都应该走 getEntryDisplay 的逻辑，但出于优化目的，没有特殊展示的就不走了
    const skills = Object.keys(this.data.skills).map(name => this.getEntryDisplay(name)).join(' ')
    const abilities = this.data.abilities.map(item => `${item.name}:${item.expression}`).join('\n')
    return '角色：' + this.name + '\n' + basic + '\n' + props + '\n' + skills + '\n' + abilities
  }

  override getAliases(name: string) {
    const _input = name.toUpperCase()
    return SKILL_ALIAS[_input] ?? [_input]
  }
}

/**
 * coc 计算属性表. 只能 getXXX, 不能 setXXX
 * 注：必须确保在 class 的计算属性中出现
 */
const COMPUTED_ENTRIES = ['MAXHP', 'MAXMP', 'MAXSAN', '体格'] as const
const COMPUTED_ABILITIES = ['DB'] as const
// 具有特殊 setter 的数值，须确保作为 setter 出现
const SPECIAL_ENTRY_SETTERS = ['HP', 'MP', 'SAN', 'CM'] as const

/**
 * coc 同义词表。注：统一为大写
 */
const _SKILL_ALIAS = Object.freeze([
  ['力量', 'STR'],
  ['敏捷', 'DEX'],
  ['意志', 'POW'],
  ['体质', 'CON'],
  ['外貌', 'APP'],
  ['教育', '知识', 'EDU'],
  ['体型', 'SIZ', 'SIZE'],
  ['智力', '灵感', 'INT'],
  ['生命', 'HP', '生命值'],
  ['生命上限', 'MAXHP', 'HPMAX', '生命值上限'],
  ['理智', 'SC', 'SAN', 'SAN值', '理智值'],
  ['理智上限', 'MAXSAN', 'SANMAX', '理智值上限'],
  ['魔法', 'MP', '魔法值'],
  ['魔法上限', 'MAXMP', 'MPMAX', '魔法值上限'],
  ['幸运', 'LUCK', 'LUK', '运气'],
  ['年龄', 'AGE'],
  ['伤害加值', 'DB'],
  ['体格', 'BUILD'],
  ['侦查', '侦察'],
  ['信用', '信誉', '信用评级'],
  ['克苏鲁', '克苏鲁神话', 'CM'],
  ['计算机', '计算机使用', '电脑'],
  ['图书馆', '图书馆使用'],
  ['汽车', '驾驶', '汽车驾驶'],
  ['博物', '博物学', '自然学'],
  ['领航', '导航'],
  ['锁匠', '开锁', '撬锁'],
  ['重型机械', '重型操作', '操作重型机械', '重型'],
  ['驯兽', '动物驯养'],
  ['骑乘', '骑术'],
])

const SKILL_ALIAS: Record<string, string[]> = _SKILL_ALIAS
  .map(line => line.reduce((obj, str) => Object.assign(obj, { [str]: line }), {}))
  .reduce((total, obj) => Object.assign(total, obj), {})

/**
 * coc 难度等级解析
 */
function parseDifficulty(expression: string): [string, Difficulty] {
  let difficulty: Difficulty = 'normal'
  if (expression.includes('困难')) {
    difficulty = 'hard'
  } else if (expression.includes('极难') || expression.includes('极限')) {
    difficulty = 'ex'
  }
  expression = expression.replace(/(困难|极难|极限)/g, '')
  return [expression.trim(), difficulty]
}

/**
 * 根据难度等级计算目标值
 * 也可以传 reverse 反向计算
 */
export function calculateTargetValueWithDifficulty(baseValue: number, difficulty: Difficulty, reverse = false) {
  if (difficulty === 'hard') {
    return reverse ? baseValue * 2 : Math.floor(baseValue / 2)
  } else if (difficulty === 'ex') {
    return reverse ? baseValue * 5 : Math.floor(baseValue / 5)
  } else {
    return baseValue
  }
}

/**
 * 获取 coc 人物卡的临时 entry
 */
export function getCocTempEntry(key: string, tempValue: number): ICocCardEntry {
  const [skillWithoutDifficulty, difficulty] = parseDifficulty(key)
  const value = calculateTargetValueWithDifficulty(tempValue, difficulty)
  return { input: key, type: 'skills', key: skillWithoutDifficulty, difficulty, value, baseValue: tempValue, isTemp: true, readonly: true }
}

/**
 * coc 默认技能值表
 */
const DEFAULT_SKILLS = Object.freeze({
  '会计': 5,
  '人类学': 1,
  '估价': 5,
  '考古学': 1,
  '取悦': 15,
  '攀爬': 20,
  '计算机': 5,
  '乔装': 5,
  '驾驶': 20,
  '电气维修': 10,
  '电子学': 1,
  '话术': 5,
  '急救': 30,
  '历史': 5,
  '恐吓': 15,
  '跳跃': 20,
  '法律': 5,
  '图书馆': 20,
  '聆听': 20,
  '锁匠': 1,
  '机械维修': 10,
  '医学': 1,
  '博物': 10,
  '导航': 10,
  '神秘学': 5,
  '克苏鲁': 0,
  '重型机械': 1,
  '说服': 10,
  '精神分析': 1,
  '心理学': 10,
  '骑乘': 5,
  '妙手': 10,
  '侦查': 25,
  '潜行': 20,
  '游泳': 20,
  '投掷': 20,
  '追踪': 10,
  '驯兽': 5,
  '潜水': 1,
  '爆破': 1,
  '读唇': 1,
  '催眠': 1,
  '炮术': 1,
  // 格斗
  '鞭': 5,
  '刀剑': 20,
  '斗殴': 25,
  '斧': 15,
  '绞索': 15,
  '连枷': 10,
  '链锯': 10,
  // 射击
  '步枪': 25,
  '冲锋枪': 15,
  '弓': 15,
  '矛': 20,
  '火焰喷射器': 10,
  '机枪': 10,
  '手枪': 20,
  '霰弹枪': 25,
  '重武器': 10,
  // 艺术与手艺
  '表演': 5,
  '美术': 5,
  '摄影': 5,
  '伪造文书': 5,
  // 科学
  '地质学': 1,
  '动物学': 1,
  '化学': 1,
  '密码学': 1,
  '气象学': 1,
  '生物学': 1,
  '数学': 10,
  '司法科学': 1,
  '天文学': 1,
  '物理学': 1,
  '药学': 1,
  '植物学': 1,
})

function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}

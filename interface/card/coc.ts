import type { ICard, ICardAbility, ICardEntry } from './index'

export type EntryType = 'basic' | 'props' | 'skills'
export type Difficulty = 'normal' | 'hard' | 'ex'

/**
 * coc 人物卡定义
 */
export interface ICocCardData {
  type: 'coc'
  version: number
  basic: {
    name: string
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
    skillGrowth: Record<string, boolean>,
    lastModified: number // ms
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
export class CocCard implements ICard<ICocCardEntry, ICocCardAbility> {
  /*private readonly */data: ICocCardData // todo 后续直接用类实现替换人物卡
  readonly defaultRoll = 'd%'

  get type() {
    return this.data.type
  }

  get name() {
    return this.data.basic.name
  }

  get lastModified() {
    return this.data.meta.lastModified
  }

  get HP() {
    return this.data.basic.HP
  }

  private set HP(value) {
    this.data.basic.HP = Math.max(value, this.MAXHP)
  }

  get MAXHP() {
    return Math.floor((this.data.props.体质 + this.data.props.体型) / 10)
  }

  private get MP() {
    return this.data.basic.MP
  }

  private set MP(value) {
    this.data.basic.MP = Math.max(value, this.MAXMP)
  }

  private get MAXMP() {
    return Math.floor(this.data.props.意志 / 5)
  }

  private get SAN() {
    return this.data.basic.SAN
  }

  private set SAN(value) {
    this.data.basic.SAN = Math.max(value, this.MAXSAN)
  }

  private get MAXSAN() {
    return Math.max(0, 99 - this.data.basic.CM)
  }

  private get CM() {
    return this.data.basic.CM
  }

  private set CM(value) {
    // 增加克苏鲁神话，控制理智值不能超出上限
    this.data.basic.CM = value
    this.SAN = Math.max(this.SAN, this.MAXSAN)
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

  private get DB() {
    return this.dbAndBuild[0]
  }

  private get 体格() {
    return this.dbAndBuild[1]
  }

  constructor(data: ICocCardData) {
    this.data = data
  }

  getAbility(input: string) {
    const _input = input.toUpperCase()
    // 获取所有可能的别名
    const possibleNames = SKILL_ALIAS[_input] ?? [_input]
    // 是否是特殊的 computed abilities
    for (const key of possibleNames) {
      const keyAsComputedAbilities = key as typeof COMPUTED_ABILITIES[number]
      if (COMPUTED_ABILITIES.includes(keyAsComputedAbilities)) {
        return { input, key, value: this[keyAsComputedAbilities], readonly: true }
      }
    }
    // 是否从配置表里找得到这个 ability
    for (const key of possibleNames) {
      const ability = this.data.abilities.find(item => item.name.toUpperCase() === key)
      if (ability) {
        return { input, key: ability.name, value: ability.expression, readonly: false }
      }
    }
    return undefined
  }

  setAbility(name: string, expression: string) {
    const abilityRet = this.getAbility(name)
    if (abilityRet) {
      if (abilityRet.readonly) return false
      // 非 readonly 情况，key 和 name 严格相等了，所以可以直接 find
      const ability = this.data.abilities.find(item => item.name === abilityRet.key)!
      if (ability.expression !== expression) {
        ability.expression = expression
        this.data.meta.lastModified = Date.now()
        return true
      } else {
        return false
      }
    } else {
      this.data.abilities.push({ name, expression, ext: '' })
      this.data.meta.lastModified = Date.now()
      return true
    }
  }

  removeAbility(name: string) {
    const abilityRet = this.getAbility(name)
    if (abilityRet && !abilityRet.readonly) {
      const index = this.data.abilities.findIndex(item => item.name === abilityRet.key)
      if (index >= 0) { // must
        this.data.abilities.splice(index, 1)
        this.data.meta.lastModified = Date.now()
        return true
      }
    }
    return false
  }

  // 不包含困难前缀的获取
  private getRawEntry(input: string): ICocCardEntryRaw | undefined {
    const _input = input.toUpperCase()
    const possibleSkills = SKILL_ALIAS[_input] ?? [_input] // 获取所有可能的属性/技能别名
    // 是否是特殊的 computed skills
    for (const key of possibleSkills) {
      const keyAsComputedEntries = key as typeof COMPUTED_ENTRIES[number]
      if (COMPUTED_ENTRIES.includes(keyAsComputedEntries)) {
        return { input, key, baseValue: this[keyAsComputedEntries], isTemp: false, readonly: true, type: 'basic' }
      }
    }
    // 遍历 basic，props 和 skills 尝试获取
    for (const key of possibleSkills) {
      for (const type of ['basic', 'props', 'skills'] as const) {
        const target = (this.data[type] as Record<string, number | string>)[key]
        if (typeof target === 'number') {
          return { input, key, baseValue: target, isTemp: false, readonly: false, type } // 返回真实存在的那个别名
        }
      }
    }
    return undefined
  }

  getEntry(input: string) {
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

  setEntry(name: string, value: number) {
    const [skillWithoutDifficulty, difficulty] = parseDifficulty(name)
    if (!skillWithoutDifficulty) return false
    // 是否是特殊的 setter，不直接调用 data，而是通过 setter 修改
    const _input = skillWithoutDifficulty.toUpperCase()
    const possibleSkills = SKILL_ALIAS[_input] ?? [_input] // 获取所有可能的属性/技能别名
    for (const key of possibleSkills) {
      const keyAsSpecialSetters = key as typeof SPECIAL_ENTRY_SETTERS[number]
      if (SPECIAL_ENTRY_SETTERS.includes(keyAsSpecialSetters)) {
        const oldValue = this[keyAsSpecialSetters]
        this[keyAsSpecialSetters] = value
        const newValue = this[keyAsSpecialSetters]
        // 判断是否是真的改变了，因为可能被 setter 拦下来，实际未改变
        if (oldValue !== newValue) {
          this.data.meta.lastModified = Date.now()
          return true
        } else {
          return false
        }
      }
    }
    // 是否已有条目
    const targetValue = calculateTargetValueWithDifficulty(value, difficulty, true)
    const rawEntry = this.getRawEntry(skillWithoutDifficulty)
    if (rawEntry) {
      if (rawEntry.readonly) return false
      if (targetValue !== rawEntry.baseValue) {
        (this.data[rawEntry.type] as Record<string, number>)[rawEntry.key] = targetValue
        this.data.meta.lastModified = Date.now()
        return true
      } else {
        return false
      }
    } else {
      // 新增条目，认为是 skill，且统一大写
      this.data.skills[_input] = targetValue
      this.data.meta.lastModified = Date.now()
      return true
    }
  }

  removeEntry(name: string) {
    const [skillWithoutDifficulty] = parseDifficulty(name)
    if (!skillWithoutDifficulty) return false
    const entry = this.getRawEntry(skillWithoutDifficulty)
    if (entry && entry.type === 'skills' && !entry.readonly) {
      delete this.data.skills[entry.key]
      this.data.meta.lastModified = Date.now()
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
      this.data.meta.lastModified = Date.now()
      return true // 返回有更新
    }
  }

  /**
   * 取消技能成长
   */
  cancelSkillGrowth(skill: string) {
    let updated = false
    const _input = skill.toUpperCase()
    const possibleSkills = SKILL_ALIAS[_input] ?? [_input]
    possibleSkills.forEach(skill => { // 把所有的别名都干掉
      if (this.data.meta.skillGrowth[skill]) {
        delete this.data.meta.skillGrowth[skill]
        updated = true
      }
    })
    return updated
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
    this.data.meta.lastModified = Date.now() // 强制认为有更新吧
  }

  getSummary() {
    const basic = [
      `生命：${this.HP}/${this.MAXHP}`,
      `理智：${this.SAN}/${this.MAXSAN}`,
      `幸运：${this.data.basic.LUCK}`,
      `魔法：${this.MP}/${this.MAXMP}`,
      `克苏鲁神话：${this.CM}`,
      `信用评级：${this.data.basic.信用}`
    ].join(' ')
    const skills = Object.entries(this.data.skills).map(([k ,v]) => `${k}：${v}`).join(' ')
    const abilities = this.data.abilities.map(item => `${item.name}：${item.expression}`).join('\n')
    return '角色：' + this.name + '\n' + basic + '\n' + skills + '\n' + abilities
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
  ['教育', 'EDU'],
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
  ['博物学', '自然学'],
  ['领航', '导航'],
  ['锁匠', '开锁', '撬锁'],
  ['重型机械', '重型操作', '操作重型机械', '重型']
])

const SKILL_ALIAS: Record<string, string[]> = _SKILL_ALIAS
  .map(line => line.reduce((obj, str) => Object.assign(obj, { [str]: line }), {}))
  .reduce((total, obj) => Object.assign(total, obj), {})

/**
 * coc 难度等级解析
 */
export function parseDifficulty(expression: string): [string, Difficulty] {
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
  '炮术': 1
})

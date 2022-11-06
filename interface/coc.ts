/**
 * coc 人物卡定义
 */
export interface ICard {
  version: number // 2
  basic: {
    name: string
    job: string
    age: number
    gender: string
    hp: number
    san: number
    luck: number
    mp: number
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
  skills: { [key: string]: number },
  meta: {
    skillGrowth: { [key: string]: boolean },
    lastModified: number // ms
  }
}

/**
 * 计算伤害加成和体格
 */
export function getDBAndSizeLevel(card: ICard): [string, number] {
  const sum = card.props['力量'] + card.props['体型'] // str+siz
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

// region
/**
 * 技能同义词表
 */
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
  ['理智', 'san', 'sc', 'SC', 'SAN', 'san值', 'SAN值', '理智值'],
  ['魔法', 'mp', 'MP'],
  ['幸运', 'luck', 'luk', 'LUK', '运气'],
  ['年龄', 'age', 'AGE'],
  ['侦查', '侦察'],
  ['信用', '信誉', '信用评级'],
  ['克苏鲁', '克苏鲁神话', 'CM', 'cm'],
  // endregion
  ['计算机', '计算机使用', '电脑'],
  ['图书馆', '图书馆使用'],
  ['汽车', '驾驶', '汽车驾驶'],
  ['博物学', '自然学'],
  ['领航', '导航'],
  ['锁匠', '开锁', '撬锁'],
  ['重型机械', '重型操作', '操作重型机械', '重型']
]

export const skillAliasMap: Record<string, string[]> = skillAlias
  .map(line => line.reduce((obj, str) => Object.assign(obj, { [str]: line }), {}))
  .reduce((total, obj) => Object.assign(total, obj), {})
// endregion

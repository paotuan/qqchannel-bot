const skillAlias = [
  // region 建议不要改
  ['力量', 'str', 'STR'],
  ['敏捷', 'dex', 'DEX'],
  ['意志', 'pow', 'POW'],
  ['体质', 'con', 'CON'],
  ['外貌', 'app', 'APP'],
  ['教育', 'edu', 'EDU'],
  ['体型', 'siz', 'SIZ', 'size', 'SIZE', '体格'],
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

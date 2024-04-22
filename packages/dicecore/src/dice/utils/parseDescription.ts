/**
 * 从表达式中提取出 [掷骰表达式|掷骰描述|临时值]
 */
export const ParseFlags = Object.freeze({
  PARSE_EXP: 0b001,
  PARSE_TEMPVALUE: 0b010,
  PARSE_MODIFIEDVALUE: 0b100
})

export const ParseFlagsAll = ParseFlags.PARSE_EXP | ParseFlags.PARSE_TEMPVALUE | ParseFlags.PARSE_MODIFIEDVALUE

// 标识一次检定请求所携带的参数：技能名，临时值，调整值
export type TestRequest = { skill: string, tempValue: number, modifiedValue: number }

// todo 待废弃？
export function parseDescriptions(rawExp: string, flag = ParseFlags.PARSE_EXP | ParseFlags.PARSE_TEMPVALUE): [string, string, number] {
  let exp = '', desc = rawExp.trim(), tempValue = NaN
  if (flag & ParseFlags.PARSE_EXP) {
    const index = desc.search(/[\p{Unified_Ideograph}\s]/u)
    const [_exp, _desc = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
    exp = _exp
    desc = _desc.trim()
  }
  if (flag & ParseFlags.PARSE_TEMPVALUE) {
    const index = desc.search(/(\d+)$/)
    const [_desc, _tempValue = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
    desc = _desc.trim()
    tempValue = parseInt(_tempValue, 10) // tempValue 不存在返回 NaN
  }
  return [exp, desc, tempValue]
}

/**
 * 解析表达式，提取出 骰子指令 和 [技能名，临时值，调整值]数组（考虑到组合技能检定的情况）
 * @param rawExp 原始输入
 * @param flag 可选解析哪些部分
 */
export function parseDescriptions2(rawExp: string, flag = ParseFlagsAll): { exp: string, skills: TestRequest[] } {
  // parse exp & desc
  let exp = '', desc = rawExp.trim()
  if (flag & ParseFlags.PARSE_EXP) { // 是否认为原始输入中包含 骰子指令。false - 用于别名指令的场景，expression 已由别名指定，此处只解析技能名和临时值
    const index = desc.search(/[\p{Unified_Ideograph}\s]/u)
    const [_exp, _desc = ''] = index < 0 ? [desc] : [desc.slice(0, index), desc.slice(index)]
    exp = _exp
    desc = _desc.trim()
  }
  const regexParts = [
    /(?<skill>[^\d\s,，;；+-]+)?/, // 匹配 0-1 个技能名（仅临时值场景可以无技能名）
    (flag & ParseFlags.PARSE_TEMPVALUE) ? /(?<tempValue>\d+)?/ : undefined, // 匹配 0-1 个临时值
    (flag & ParseFlags.PARSE_MODIFIEDVALUE) ? /(?<modified>[+-]\s*\d+)?/ : undefined // 匹配调整值
  ]
  const regex = new RegExp(regexParts.filter(p => !!p).map(p => p!.source).join('\\s*'), 'g') // 各部分之间可以通过 0-多个空格连接
  // const regex = /(?<skill>[^\d\s,，;；]+)?\s*(?<tempValue>\d+)?\s*(?<modified>[+-]\s*\d+)?/g
  const matchResult =
    [...desc.matchAll(regex)]
      .map(entry => entry.groups || {})
      .filter(({ skill, tempValue, modified}) => skill || tempValue || modified) // 过滤掉没有匹配到任何东西的条目
      .map(groups => {
        const skill = groups.skill || ''
        const tempValue = parseInt(groups.tempValue, 10) // NaN 代表没设
        const modifiedValue = parseInt((groups.modified || '').replace(/\s+/g, '')) // NaN 代表没设。允许 +/- 和数字之间带空格
        return { skill, tempValue, modifiedValue }
      })
  return { exp, skills: matchResult }
}

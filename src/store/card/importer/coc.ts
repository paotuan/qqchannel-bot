import { CocCard, ICocCardData } from '../../../../interface/card/coc'
import { VERSION_CODE } from '../../../../interface/version'
import XLSX from 'xlsx'

export function getCocCardProto(name?: string): ICocCardData {
  return {
    type: 'coc',
    version: VERSION_CODE,
    name: name || '未命名',
    lastModified: Date.now(),
    basic: {
      job: '学生',
      AGE: 24,
      gender: '秀吉',
      HP: 0,
      SAN: 0,
      LUCK: 0,
      MP: 0,
      CM: 0,
      '信用': 0
    },
    props: {
      '力量': 0,
      '体质': 0,
      '体型': 0,
      '敏捷': 0,
      '外貌': 0,
      '智力': 0,
      '意志': 0,
      '教育': 0
    },
    skills: {},
    abilities: [],
    ext: '',
    meta: {
      skillGrowth: {}
    }
  }
}

function _unifiedKey(key: string) {
  let unifiedKey = key
  if (unifiedKey.startsWith('计算机')) {
    unifiedKey = '计算机'
  } else if (unifiedKey.startsWith('图书馆')) {
    unifiedKey = '图书馆'
  } else if (unifiedKey.startsWith('电子学')) {
    unifiedKey = '电子学'
  } else if (unifiedKey.startsWith('母语')) {
    unifiedKey = '母语'
  }
  return unifiedKey
}

export function parseCocXlsx(workbook: XLSX.WorkBook) {
  const user = getCocCardProto()
  const setter = new CocCard(user)
  // 解析 excel
  const sheet = workbook.Sheets['人物卡']
  const cySheet = workbook.Sheets['简化卡 骰娘导入']
  if (cySheet) {
    // 是否是 CY 卡
    user.name = sheet['E3']?.v || '未命名'
    user.basic.job = sheet['E5']?.v || ''
    user.basic.AGE = sheet['E6']?.v || 0
    user.basic.gender = sheet['M6']?.v || ''
    // 其他属性直接读导入表达式
    const exps: string = cySheet['B40']?.v || ''
    Array.from(exps.slice(4).matchAll(/\D+\d+/g)).map(match => match[0]).forEach(entry => {
      const index = entry.search(/\d/) // 根据数字分隔
      const name = entry.slice(0, index).trim()
      const value = parseInt(entry.slice(index), 10)
      if (!name || isNaN(value)) return // 理论不可能
      setter.setEntry(_unifiedKey(name), value)
    })
    // 读武器列表
    for (let i = 53; i <= 58; i++) {
      const combatName = sheet['B' + i]?.v || ''
      if (!combatName) continue
      const expression = sheet['W' + i]?.v || ''
      user.abilities.push({
        name: combatName,
        expression: expression.toLowerCase().replaceAll('db', '$db'),
        ext: sheet['M' + i]?.v || ''
      })
    }
  } else {
    // read basic info
    user.name = sheet['D3']?.v || '未命名'
    user.basic = {
      job: sheet['D5']?.v || '',
      AGE: sheet['D6']?.v || 0,
      gender: sheet['L6']?.v || '',
      HP: sheet['F10']?.v || 0,
      SAN: sheet['N10']?.v || 0,
      LUCK: sheet['V10']?.v || 0,
      MP: (sheet['AD10'] || sheet['AF10'])?.v || 0,
      CM: 0, // 这里先留空，后面会通过 setEntry 设置上去
      '信用': 0
    }
    // read props
    user.props = {
      '力量': sheet['S3']?.v || 0,
      '体质': sheet['S5']?.v || 0,
      '体型': sheet['S7']?.v || 0,
      '敏捷': sheet['Y3']?.v || 0,
      '外貌': sheet['Y5']?.v || 0,
      '智力': sheet['Y7']?.v || 0,
      '意志': sheet['AE3']?.v || 0,
      '教育': sheet['AE5']?.v || 0,
    }
    // read first column
    const E_LINES = [19, 20, 21, 33, 34, 35, 36, 37, 38, 43, 44, 45]
    for (let i = 15; i <= 46; i++) {
      const name = sheet[(E_LINES.includes(i) ? 'E' : 'C') + i]
      if (!name) continue // 自选技能，玩家没选的情况
      setter.setEntry(_unifiedKey(name.v), sheet['P' + i].v)
    }
    // read second column
    const Y_LINES = [26, 30, 31, 32, 36, 40]
    for (let i = 15; i <= 40; i++) {
      const name = sheet[(Y_LINES.includes(i) ? 'Y' : 'W') + i]
      if (!name) continue // 自选技能，玩家没选的情况
      setter.setEntry(_unifiedKey(name.v), sheet['AJ' + i].v)
    }
    // 读武器列表
    for (let i = 50; i <= 55; i++) {
      const combatName = sheet['B' + i]?.v || ''
      if (!combatName) continue
      const expression = sheet['R' + i]?.v || ''
      user.abilities.push({
        name: combatName,
        expression: expression.toLowerCase().replaceAll('db', '$db'),
        ext: ''
      })
    }
  }

  return setter
}

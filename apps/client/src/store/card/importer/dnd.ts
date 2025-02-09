import { DndCard, type IDndCardData } from '@paotuan/card'
import { VERSION_CODE } from '@paotuan/types'
import XLSX from 'xlsx'
import { addOrUpdateByName } from './utils'

/**
 * @deprecated
 */
export function getDndCardProto(name?: string): IDndCardData {
  return {
    type: 'dnd',
    version: VERSION_CODE,
    name: name || '未命名',
    created: Date.now(),
    lastModified: Date.now(),
    isTemplate: false,
    info: {
      job: '',
      gender: '',
      age: 24,
      race: '',
      camp: ''
    },
    basic: {
      EXP: 0,
      LV: 1,
      '熟练': 2,
      HP: 10,
      MAXHP: 10,
      AC: 10,
      '先攻临时': 0
    },
    props: {
      '力量': 0,
      '敏捷': 0,
      '体质': 0,
      '智力': 0,
      '感知': 0,
      '魅力': 0,
    },
    skills: {
      '运动': 0,
      '体操': 0,
      '巧手': 0,
      '隐匿': 0,
      '奥秘': 0,
      '历史': 0,
      '调查': 0,
      '自然': 0,
      '宗教': 0,
      '驯兽': 0,
      '洞悉': 0,
      '医疗': 0,
      '察觉': 0,
      '生存': 0,
      '欺瞒': 0,
      '威吓': 0,
      '表演': 0,
      '说服': 0,
    },
    items: {
      CP: 0,
      SP: 0,
      GP: 0,
      EP: 0,
      PP: 0,
    },
    equips: [],
    spells: [],
    ext: '',
    templateData: {},
    meta: {
      spellSlots: {
        1: { value: 0, max: 0 },
        2: { value: 0, max: 0 },
        3: { value: 0, max: 0 },
        4: { value: 0, max: 0 },
        5: { value: 0, max: 0 },
        6: { value: 0, max: 0 },
        7: { value: 0, max: 0 },
        8: { value: 0, max: 0 },
        9: { value: 0, max: 0 },
      },
      deathSaving: { success: 0, failure: 0 },
      experienced: {}
    },
    jobAbilities: [],
    specialists: []
  }
}

export function parseDndXlsx(setter: DndCard, workbook: XLSX.WorkBook) {
  const sheet_v1 = workbook.Sheets['主要']
  const sheet_v2 = workbook.Sheets['主要情况']
  if (sheet_v1) {
    parseDnd_variant1(workbook, setter)
  } else if (sheet_v2) {
    parseDnd_variant2(workbook, setter)
  }
  return setter
}

function parseDnd_variant1(workbook: XLSX.WorkBook, setter: DndCard) {
  const sheet = workbook.Sheets['主要']
  const user = setter.data
  user.name = sheet['D3']?.v || '未命名'
  user.info.job = [sheet['R4']?.v, sheet['V4']?.v].filter(item => !!item).join(' ')
  user.info.gender = sheet['L6']?.v || ''
  user.info.age = sheet['L7']?.v || 24
  user.info.race = [sheet['D6']?.v, sheet['D7']?.v].filter(item => !!item).join(' ')
  user.info.camp = sheet['L9']?.v || ''
  user.basic.EXP = sheet['R3']?.v || 0
  user.basic.LV = sheet['Y4']?.v || 1
  user.basic.熟练 = sheet['U9']?.v || 2
  user.basic.HP = sheet['M23']?.v || 10
  user.basic.MAXHP = sheet['Q23']?.v || 10
  user.basic.AC = sheet['D26']?.v || 10
  user.basic.先攻临时 = sheet['G23']?.v || 0
  // props: C列 name ,F14-F19 value，R列调整值 T列豁免值
  for (let i = 14; i <= 19; i++) {
    const name = sheet['C' + i]?.v
    const value = sheet['F' + i]?.v
    if (typeof name === 'string' && typeof value === 'number') {
      setter.setEntry(name, value)
    }
    // 判断属性豁免熟练
    const modifiedValue = sheet['R' + i]?.v
    const savingValue = sheet['T' + i]?.v
    if (typeof modifiedValue === 'number' && typeof savingValue === 'number' && savingValue - modifiedValue !== 0) {
      setter.markExperienced(name)
    }
  }
  // skills： 39-60 C列 name，F value，跳过 40 44 50 56
  for (let i = 39; i <= 60; i++) {
    if ([40, 44, 50, 56].includes(i)) continue
    const name = sheet['C' + i]?.v
    const value = sheet['F' + i]?.v
    if (typeof name === 'string' && typeof value === 'number') {
      setter.setEntry(name, value)
    }
    // 判断技能熟练
    const finalValue = sheet['I' + i]?.v
    const propI = i <= 39 ? 14 : i <= 43 ? 15 : i <= 49 ? 17 : i <= 55 ? 18 : 19
    const propValue = sheet['R' + propI]?.v
    if (typeof finalValue === 'number' && typeof propValue === 'number' && finalValue - propValue !== 0) {
      setter.markExperienced(name)
    }
  }
  // 金币
  user.items.CP = sheet['Q62']?.v || 0
  user.items.SP = sheet['W62']?.v || 0
  user.items.EP = sheet['AC62']?.v || 0
  user.items.GP = sheet['AI62']?.v || 0
  user.items.PP = sheet['AO62']?.v || 0
  // equips
  const armorName = sheet['L39']?.v // 护甲
  if (armorName) {
    addOrUpdateByName(user.equips, {
      name: armorName,
      expression: String(sheet['AC39']?.v || ''),
      ext: ''
    })
  }
  // 武器 41-45 L:name， AI 伤害 AD 命中
  for (let i = 41; i <= 45; i++) {
    const name = sheet['L' + i]?.v
    if (typeof name === 'string' && name) {
      addOrUpdateByName(user.equips, {
        name: name + '命中',
        expression: String(sheet['AD' + i]?.v || '').toLowerCase(),
        ext: ''
      })
      addOrUpdateByName(user.equips, {
        name,
        expression: String(sheet['AI' + i]?.v || '').toLowerCase(),
        ext: ''
      })
    }
  }
  // 法术 66-80 C J Q 三列
  for (const col of [['B', 'C'], ['I', 'J'], ['P', 'Q']]) {
    const [lvCol, nameCol] = col
    for (let i = 66; i <= 80; i++) {
      const name = sheet[nameCol + i]?.v
      if (typeof name === 'string' && name) {
        addOrUpdateByName(user.spells, {
          name,
          expression: String(sheet[lvCol + i]?.v || ''),
          ext: ''
        })
      }
    }
  }
  // 法术位 52-60 AO AR
  for (let i = 52; i <= 60; i++) {
    const index = i - 51
    const value = sheet['AO' + i]?.v || 0
    const max = sheet['AR' + i]?.v || 0
    user.meta.spellSlots[index] = { value, max }
  }
  // 职业能力
  for (let i = 84; i <= 128; i++) {
    const name = sheet['C' + i]?.v
    if (!name) continue
    const lv = Number(sheet['B' + i]?.v) || 0
    const desc = sheet['H' + i]?.v || ''
    addOrUpdateByName(user.jobAbilities, { lv, name, desc })
  }
  // 专长
  for (let i = 109; i <= 117; i++) {
    const name = sheet['Z' + i]?.v
    if (!name) continue
    const lv = Number(sheet['Y' + i]?.v) || 0
    const desc = sheet['AE' + i]?.v || ''
    addOrUpdateByName(user.specialists, { lv, name, desc })
  }
}

function parseDnd_variant2(workbook: XLSX.WorkBook, setter: DndCard) {
  const sheet = workbook.Sheets['主要情况']
  const user = setter.data
  const sheetBasic = workbook.Sheets['角色']
  // basic info
  user.name = sheet['E3']?.v || '未命名'
  user.info.job = sheet['S3']?.v || ''
  user.info.gender = sheetBasic?.['E7']?.v || ''
  user.info.age = sheetBasic?.['M7']?.v || 24
  user.info.race = [sheetBasic?.['E6']?.v, sheetBasic?.['E8']?.v].filter(item => !!item).join(' ')
  user.info.camp = sheetBasic?.['M6']?.v || ''
  user.basic.EXP = sheet['AC4']?.v || 0
  user.basic.LV = sheet['W3']?.v || 1
  user.basic.熟练 = sheet['AC3']?.v || 2
  user.basic.HP = sheet['Y8']?.v || 10
  user.basic.MAXHP = sheet['AC8']?.v || 10
  user.basic.AC = sheet['P10']?.v || 10
  user.basic.先攻临时 = sheet['S8']?.v || 0
  // props: C列 name ,E8-E18 value
  for (let i = 8; i <= 18; i += 2) {
    const name = sheet['C' + i]?.v
    const value = sheet['E' + i]?.v || 0
    if (typeof name === 'string') {
      const _name = name.substring(0, 2)
      setter.setEntry(_name, value)
      // 判断属性豁免熟练
      const mark = sheet['B' + i]?.v
      if (mark !== 'X') {
        setter.markExperienced(_name)
      }
    }
  }
  // skills： 23-44 C列 name，F value，跳过 24 28 34 40
  for (let i = 23; i <= 44; i++) {
    if ([24, 28, 34, 40].includes(i)) continue
    const name = sheet['C' + i]?.v
    const value = sheet['F' + i]?.v || 0
    if (typeof name === 'string') {
      setter.setEntry(name, value)
      // 判断技能熟练
      const mark = sheet['B' + i]?.v
      if (mark !== 'X') {
        setter.markExperienced(name)
      }
    }
  }
  // 金币
  user.items.CP = sheet['AG44']?.v || 0
  user.items.SP = sheet['AG43']?.v || 0
  user.items.EP = sheet['AG41']?.v || 0
  user.items.GP = sheet['AG42']?.v || 0
  user.items.PP = sheet['AG40']?.v || 0
  // equips
  const armorName = sheet['O23']?.v // 护甲
  if (armorName) {
    addOrUpdateByName(user.equips, {
      name: armorName,
      expression: String(sheet['AD23']?.v || ''),
      ext: ''
    })
  }
  // 武器 25-29 O:name， AI 伤害 AF 命中
  for (let i = 25; i <= 29; i++) {
    const name = sheet['O' + i]?.v
    if (typeof name === 'string' && name) {
      const aimAdd = sheet['AF' + i]?.v || ''
      addOrUpdateByName(user.equips, {
        name: name + '命中',
        expression: aimAdd ? `d20+${aimAdd}` : 'd20',
        ext: ''
      })
      addOrUpdateByName(user.equips, {
        name,
        expression: sheet['AI' + i]?.v || '',
        ext: ''
      })
    }
  }
  // 法术 AD 33-34
  for (let i = 33; i <= 34; i++) {
    const name = sheet['AD' + i]?.v || ''
    const expression = sheet['AM' + i]?.v || ''
    if (typeof name === 'string' && name) {
      addOrUpdateByName(user.spells, {
        name,
        expression,
        ext: ''
      })
    }
  }
  // 法术位 36-44 AO AR
  for (let i = 36; i <= 44; i++) {
    const index = i - 35
    const value = sheet['AO' + i]?.v || 0
    const max = sheet['AR' + i]?.v || 0
    user.meta.spellSlots[index] = { value, max }
  }
  // 职业能力 3-29 AV
  for (let i = 3; i <= 29; i++) {
    const name = sheet['AW' + i]?.v
    if (!name) continue
    const lv = Number(sheet['AV' + i]?.v) || 0
    const desc = sheet['BB' + i]?.v || ''
    addOrUpdateByName(user.jobAbilities, { lv, name, desc })
  }
  // 专长 15-21
  for (let i = 15; i <= 21; i++) {
    const name = sheet['BN' + i]?.v
    if (!name) continue
    const lv = Number(sheet['BM' + i]?.v) || 0
    const desc = sheet['BS' + i]?.v || ''
    addOrUpdateByName(user.specialists, { lv, name, desc })
  }
}

export function parseDndXlsxName(workbook: XLSX.WorkBook) {
  const sheet_v1 = workbook.Sheets['主要']
  const sheet_v2 = workbook.Sheets['主要情况']
  if (sheet_v1) {
    return sheet_v1['D3']?.v || ''
  } else if (sheet_v2) {
    return sheet_v2['E3']?.v || ''
  } else {
    return ''
  }
}

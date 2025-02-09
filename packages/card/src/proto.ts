import { IGeneralCardData } from './general'
import { VERSION_CODE } from './utils/version'
import { ICocCardData } from './coc'
import { IDndCardData } from './dnd'

const GENERAL = Object.freeze<IGeneralCardData>({
  type: 'general',
  version: VERSION_CODE,
  name: '未命名', // 外部赋值
  created: 0, // 外部赋值
  lastModified: 0, // 外部赋值
  isTemplate: false,
  ext: '',
  skills: { HP: 0, MAXHP: 0 },
  abilities: [],
  templateData: {}
})

const COC = Object.freeze<ICocCardData>({
  type: 'coc',
  version: VERSION_CODE,
  name: '未命名', // 外部赋值
  created: 0, // 外部赋值
  lastModified: 0, // 外部赋值
  isTemplate: false,
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
  templateData: {},
  meta: {
    skillGrowth: {}
  }
})

const DND = Object.freeze<IDndCardData>({
  type: 'dnd',
  version: VERSION_CODE,
  name: '未命名', // 外部赋值
  created: 0, // 外部赋值
  lastModified: 0, // 外部赋值
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
})

export const CardProto = Object.freeze({
  general: GENERAL,
  coc: COC,
  dnd: DND
})

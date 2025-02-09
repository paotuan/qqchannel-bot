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
  skills: {
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
  },
  abilities: [],
  ext: '',
  templateData: {
    'props.力量': '3d6*5',
    'props.体质': '3d6*5',
    'props.体型': '(2d6+6)*5',
    'props.敏捷': '3d6*5',
    'props.外貌': '3d6*5',
    'props.智力': '(2d6+6)*5',
    'props.意志': '3d6*5',
    'props.教育': '(2d6+6)*5',
    'basic.LUCK': '3d6*5'
  },
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

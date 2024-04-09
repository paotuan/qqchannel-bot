import { IDndCardData } from '@paotuan/types'
import { VERSION_CODE } from '@paotuan/types'
import { ICocCardData } from '@paotuan/types'
import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
import { IGeneralCardData } from '@paotuan/types'

export const MockBotId = '__mock_bot_id__'
export const MockGuildId = '__mock_guild_id__'
export const MockChannelId = '__mock_channel_id__'
export const MockUserId = '__mock_user_id__'

export const resetRandomEngine = (seed: number) => (NumberGenerator.generator.engine = { next: () => seed })

export function getCocCardProto(): ICocCardData {
  return {
    type: 'coc',
    version: VERSION_CODE,
    name: '铃木翼',
    created: Date.now(),
    lastModified: Date.now(),
    isTemplate: false,
    basic: {
      job: '学生',
      AGE: 24,
      gender: '秀吉',
      HP: 10,
      SAN: 30,
      LUCK: 50,
      MP: 10,
      CM: 0,
      '信用': 0
    },
    props: {
      '力量': 60,
      '体质': 60,
      '体型': 60,
      '敏捷': 60,
      '外貌': 60,
      '智力': 60,
      '意志': 60,
      '教育': 60
    },
    skills: {
      '侦查': 40,
      '图书馆': 70
    },
    abilities: [
      {
        name: '徒手格斗',
        expression: '1d3+$db',
        ext: ''
      }
    ],
    ext: '',
    meta: {
      skillGrowth: {}
    }
  }
}

export function getDndCardProto(): IDndCardData {
  return {
    type: 'dnd',
    version: VERSION_CODE,
    name: '铃木翼',
    created: Date.now(),
    lastModified: Date.now(),
    isTemplate: false,
    info: {
      job: '战士',
      gender: '男',
      age: 24,
      race: '人类',
      camp: '混乱邪恶'
    },
    basic: {
      EXP: 0,
      LV: 1,
      '熟练': 2,
      HP: 12,
      MAXHP: 12,
      AC: 12,
      '先攻临时': 0
    },
    props: {
      '力量': 17,
      '敏捷': 14,
      '体质': 15,
      '智力': 12,
      '感知': 10,
      '魅力': 8,
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
    equips: [
      { name: '战斧命中', expression: 'd20+$力量调整+$熟练', ext: '' },
      { name: '战斧', expression: '1d8+$力量调整', ext: '' },
    ],
    spells: [],
    ext: '',
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
      experienced: {
        '力量': true,
        '体质': true,
        '运动': true
      }
    },
    jobAbilities: [],
    specialists: []
  }
}

export function getGeneralCardProto(): IGeneralCardData {
  return {
    type: 'general',
    version: VERSION_CODE,
    name: '铃木翼',
    created: Date.now(),
    lastModified: Date.now(),
    isTemplate: false,
    ext: '',
    skills: {
      '力量': 60,
      '体质': 60,
    },
    abilities: [{ key: '徒手格斗', value: '1d3+$db' }]
  }
}

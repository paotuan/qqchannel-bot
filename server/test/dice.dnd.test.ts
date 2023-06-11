import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
import { ICard } from '../../interface/card/types'
import { createDiceRoll, IDiceRollContext } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'
import { DndCard, IDndCardData } from '../../interface/card/dnd'
import { VERSION_CODE } from '../../interface/version'

// use a custom engine
NumberGenerator.generator.engine = {
  next() {
    return 11
  }
}

const MockChannelId = '__mock_channel_id__'
const MockUserId = '__mock_user_id__'

function createContext(card: ICard): IDiceRollContext {
  // 修改为 dnd 的一些设置
  const config = getInitialDefaultConfig()
  // config.defaultRoll.expression = 'd20'
  config.rollDeciderId = 'io.paotuan.embed.dnd0'
  return {
    channelId: MockChannelId,
    userId: MockUserId,
    username: 'Maca',
    userRole: 'admin',
    config: new ChannelConfig(config),
    getCard: () => card
  }
}

describe('已关联DND人物卡', () => {
  // 生成一个通用的只读 config，用于大部分的情况
  const context = createContext(new DndCard(getCardProto()))

  test('属性检定', () => {
    const roller = createDiceRoll('力量', context)
    expect(roller.output).toBe('Maca 🎲 力量 d20+3: [12]+3 = 15')
  })

  test('技能检定', () => {
    const roller = createDiceRoll('运动', context)
    expect(roller.output).toBe('Maca 🎲 运动 d20+{3}[力量]+{2}[熟练]: [12]+{3}+{2} = 17')
  })

  test('属性豁免', () => {
    const roller = createDiceRoll('力量豁免', context)
    expect(roller.output).toBe('Maca 🎲 力量豁免 d20+5: [12]+5 = 17') // 现在因为 力量豁免 作为整体去 getEntry，属性调整值和熟练度是没分开的，看是否需要
  })

  test('不存在技能', () => {
    const roller = createDiceRoll('不存在技能', context)
    expect(roller.output).toBe('Maca 🎲 不存在技能 d20: [12] = 12')
  })

  test('使用DC', () => {
    const roller = createDiceRoll('力量10', context)
    expect(roller.output).toBe('Maca 🎲 力量 d20+3: [12]+3 = 15 ≥ 10 成功')
  })

  test('指定表达式检定', () => {
    const roller = createDiceRoll('2d20k1力量10', context)
    expect(roller.output).toBe('Maca 🎲 力量 2d20k1+3: [12d, 12]+3 = 15 ≥ 10 成功')
  })

  test('人物卡引用', () => {
    const roller = createDiceRoll('3d20<=$ac', context)
    expect(roller.output).toBe('Maca 🎲 3d20<=12: [12*, 12*, 12*] = 3')
  })

  test('直接引用表达式', () => {
    const roller = createDiceRoll('战斧命中', context)
    expect(roller.output).toBe('Maca 🎲 战斧命中 d20+3+2: [12]+3+2 = 17')
  })

  test('描述不应解析为表达式', () => {
    const roller = createDiceRoll('d20 战斧命中', context)
    expect(roller.output).toBe('Maca 🎲 战斧命中 d20: [12] = 12')
  })

  test('表达式内嵌', () => {
    const roller = createDiceRoll('$战斧命中+1d6+1', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 战斧命中 d20+3+2: [12]+3+2 = 17\n最后 🎲 17+1d6+1: 17+[6]+1 = 24')
  })

  test('组合检定', () => {
    const roller = createDiceRoll('力量10 医疗', context)
    expect(roller.output).toBe('Maca 🎲 力量，医疗\nd20+3: [12]+3 = 15 ≥ 10 成功\nd20+{0}[感知]: [12]+{0} = 12') // 因为和 coc 组合检定不一样（不是一次检定对应多个判定结果，而是每次都是一个独立的检定），每行没有名字回显，不过问题不大，先不管了
  })

  test('死亡豁免', () => {
    const card = new DndCard(getCardProto())
    const context = createContext(card)
    const roller = createDiceRoll('ds', context)
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [12] = 12 ≥ 10 成功')
    roller.applyToCard()
    expect(card.data.meta.deathSaving.success).toBe(1)
  })

  test('死亡豁免失败', () => {
    NumberGenerator.generator.engine = { next: () => 1 }
    const card = new DndCard(getCardProto())
    const context = createContext(card)
    const roller = createDiceRoll('ds', context)
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [2] = 2 ＜ 10 失败')
    roller.applyToCard()
    expect(card.data.meta.deathSaving.failure).toBe(1)
    NumberGenerator.generator.engine = { next: () => 11 }
  })

  test('死亡豁免大失败', () => {
    NumberGenerator.generator.engine = { next: () => 0 }
    const card = new DndCard(getCardProto())
    const context = createContext(card)
    const roller = createDiceRoll('ds', context)
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [1] = 1 二次失败')
    roller.applyToCard()
    expect(card.data.meta.deathSaving.failure).toBe(2)
    NumberGenerator.generator.engine = { next: () => 11 }
  })

  test('死亡豁免大成功', () => {
    NumberGenerator.generator.engine = { next: () => 19 }
    const card = new DndCard(getCardProto())
    card.HP = 0
    card.data.meta.deathSaving.success = 2
    card.data.meta.deathSaving.failure = 2
    const context = createContext(card)
    const roller = createDiceRoll('ds', context)
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [20] = 20 起死回生，HP+1')
    roller.applyToCard()
    expect(card.HP).toBe(1)
    expect(card.data.meta.deathSaving.success).toBe(0)
    expect(card.data.meta.deathSaving.failure).toBe(0)
    NumberGenerator.generator.engine = { next: () => 11 }
  })

  test('dnd先攻默认骰', () => {
    const roller = createDiceRoll('ri', context)
    expect(roller.output).toBe('Maca 🎲 先攻 d20+{2}[敏捷]: [12]+{2} = 14')
  })

  test('st属性', () => {
    const roller = createDiceRoll('st show 力量', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼): 力量*:17`)
  })

  test('st技能应展示总值和修正值', () => {
    const roller = createDiceRoll('st show 运动', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼): 运动*:5(0)`)
  })

  test('st修改技能应重定向到修正值', () => {
    const card = new DndCard(getCardProto())
    const context = createContext(card)
    const roller = createDiceRoll('st 运动+1', context)
    expect(roller.output).toBe('<@!__mock_user_id__>(铃木翼) 设置 运动修正 0+1: 0+1 = 1')
    roller.applyToCard()
    expect(card.data.skills.运动).toBe(1)
  })
})

function getCardProto(): IDndCardData {
  return {
    type: 'dnd',
    version: VERSION_CODE,
    name: '铃木翼',
    lastModified: Date.now(),
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

export {}

import { ICard } from '../../interface/card/types'
import { createDiceRoll, IDiceRollContext } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'
import { DndCard } from '../../interface/card/dnd'
import { getDndCardProto, MockChannelId, MockUserId, resetRandomEngine } from './utils'

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
    getCard: () => card,
    linkCard: () => {},
    queryCard: () => []
  }
}

describe('已关联DND人物卡', () => {
  let card: DndCard
  let context: IDiceRollContext

  beforeEach(() => {
    card = new DndCard(getDndCardProto())
    context = createContext(card)
    resetRandomEngine(11)
  })

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
    expect(roller.output).toBe('Maca 🎲 力量 d20+3: [12]+3 = 15 / 10 成功')
  })

  test('指定表达式检定', () => {
    const roller = createDiceRoll('2d20k1力量10', context)
    expect(roller.output).toBe('Maca 🎲 力量 2d20k1+3: [12d, 12]+3 = 15 / 10 成功')
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
    expect(roller.output).toBe('Maca 🎲 力量，医疗\nd20+3: [12]+3 = 15 / 10 成功\nd20+{0}[感知]: [12]+{0} = 12') // 因为和 coc 组合检定不一样（不是一次检定对应多个判定结果，而是每次都是一个独立的检定），每行没有名字回显，不过问题不大，先不管了
  })

  test('死亡豁免', () => {
    const roller = createDiceRoll('ds', context)
    roller.applyToCard()
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [12] = 12 / 10 成功')
    expect(card.data.meta.deathSaving.success).toBe(1)
  })

  test('死亡豁免失败', () => {
    resetRandomEngine(1)
    const roller = createDiceRoll('ds', context)
    roller.applyToCard()
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [2] = 2 / 10 失败')
    expect(card.data.meta.deathSaving.failure).toBe(1)
  })

  test('死亡豁免大失败', () => {
    resetRandomEngine(0)
    const roller = createDiceRoll('ds', context)
    roller.applyToCard()
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [1] = 1 二次失败')
    expect(card.data.meta.deathSaving.failure).toBe(2)
  })

  test('死亡豁免大成功', () => {
    resetRandomEngine(19)
    card.HP = 0
    card.data.meta.deathSaving.success = 2
    card.data.meta.deathSaving.failure = 2
    const roller = createDiceRoll('ds', context)
    roller.applyToCard()
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [20] = 20 起死回生，HP+1')
    expect(card.HP).toBe(1)
    expect(card.data.meta.deathSaving.success).toBe(0)
    expect(card.data.meta.deathSaving.failure).toBe(0)
  })

  test('死亡豁免累积三次成功', () => {
    card.HP = 0
    card.data.meta.deathSaving.success = 2
    card.data.meta.deathSaving.failure = 2
    const roller = createDiceRoll('ds', context)
    roller.applyToCard()
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [12] = 12 / 10 成功\n成功三次，伤势稳定了')
    expect(card.HP).toBe(0)
    expect(card.data.meta.deathSaving.success).toBe(0)
    expect(card.data.meta.deathSaving.failure).toBe(0)
  })

  test('死亡豁免累积三次失败', () => {
    resetRandomEngine(1)
    card.HP = 0
    card.data.meta.deathSaving.success = 2
    card.data.meta.deathSaving.failure = 2
    const roller = createDiceRoll('ds', context)
    roller.applyToCard()
    expect(roller.output).toBe('Maca 🎲 死亡豁免 d20: [2] = 2 / 10 失败\n失败三次，去世了')
    expect(card.HP).toBe(0)
    expect(card.data.meta.deathSaving.success).toBe(2)
    expect(card.data.meta.deathSaving.failure).toBe(3)
  })

  test('dnd先攻默认骰', () => {
    const roller = createDiceRoll('ri', context)
    expect(roller.output).toBe('Maca 🎲 先攻 d20+{2}[敏捷]+{0}[临时]: [12]+{2}+{0} = 14')
  })

  test('st属性', () => {
    const roller = createDiceRoll('st show 力量', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼):\n力量*:17`)
  })

  test('st技能应展示总值和修正值', () => {
    const roller = createDiceRoll('st show 运动', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼):\n运动*:5(0)`)
  })

  test('st修改技能应重定向到修正值', () => {
    const roller = createDiceRoll('st 运动+1', context)
    roller.applyToCard()
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼) 设置:\n运动修正 0+1: 0+1 = 1`)
    expect(card.data.skills.运动).toBe(1)
  })
})

export {}

import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
import type { IDiceRollContext } from '../service/dice/utils'
import { createDiceRoll } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'
import type { ICard } from '../../interface/coc'
import { CocCard } from '../service/card/coc'

// use a custom engine
NumberGenerator.generator.engine = {
  next() {
    return 1
  }
}

describe('未关联人物卡', () => {
  const context: IDiceRollContext = {
    channelId: 'abc123',
    userId: 'abc456',
    username: 'Maca',
    userRole: 'admin',
    config: new ChannelConfig(getInitialDefaultConfig()),
    getCard: () => null,
  }

  test('基础指令', () => {
    const roller = createDiceRoll('d100', context)
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('基础运算', () => {
    const roller = createDiceRoll('2d10+d6+1', context)
    expect(roller.output).toBe('Maca 🎲 2d10+d6+1: [2, 2]+[2]+1 = 7')
  })

  test('描述回显', () => {
    const roller = createDiceRoll('d100 侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('临时检定', () => {
    const roller = createDiceRoll('d100 侦察 50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 50 成功')
  })

  test('空格可以省略', () => {
    const roller = createDiceRoll('d100侦察50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 50 成功')
  })

  test('默认骰1', () => {
    const roller = createDiceRoll('r', context)
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('默认骰2', () => {
    const roller = createDiceRoll('d', context)
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('默认骰3', () => {
    const roller = createDiceRoll('rd', context)
    expect(roller.output).toBe('Maca 🎲 d100: [2] = 2')
  })

  test('默认骰回显描述1', () => {
    const roller = createDiceRoll('d侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('默认骰回显描述2', () => {
    const roller = createDiceRoll('侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2')
  })

  test('奖励骰别名', () => {
    const roller = createDiceRoll('rb', context)
    expect(roller.output).toBe('Maca 🎲 2d%kl1: [2, 2d] = 2')
  })

  test('惩罚骰别名', () => {
    const roller = createDiceRoll('rp2', context)
    expect(roller.output).toBe('Maca 🎲 3d%kh1: [2d, 2d, 2] = 2')
  })

  test('奖励骰临时检定', () => {
    const roller = createDiceRoll('rb侦察50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 2d%kl1: [2, 2d] = 2 ≤ 50 成功')
  })

  test('骰池别名', () => {
    const roller = createDiceRoll('ww4', context)
    expect(roller.output).toBe('Maca 🎲 4d10!>=10>=8: [2, 2, 2, 2] = 0')
  })

  test('骰池别名2', () => {
    const roller = createDiceRoll('ww4a5', context)
    expect(roller.output).toBe('Maca 🎲 4d10!>=5>=8: [2, 2, 2, 2] = 0')
  })

  test('检定别名', () => {
    const roller = createDiceRoll('rc', context)
    expect(roller.output).toBe('Maca 🎲 d%: [2] = 2')
  })

  test('暗骰 flag', () => {
    const roller = createDiceRoll('rh心理学', context)
    expect(roller.output).toBe('Maca 🎲 心理学 d100: [2] = 2')
  })

  test('flag 组合', () => {
    const roller = createDiceRoll('rqx3 手枪连射', context)
    expect(roller.output).toBe('Maca 🎲 手枪连射\nd100 = 2\nd100 = 2\nd100 = 2')
  })

  test('flag 组合2', () => {
    const roller = createDiceRoll('rb2qh 组合', context)
    expect(roller.output).toBe('Maca 🎲 组合 3d%kl1 = 2')
  })

  test('对抗标记', () => {
    const roller = createDiceRoll('v侦察50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 50 成功\n> 回复本条消息以进行对抗')
  })

  test('对抗标记+检定别名', () => {
    const roller = createDiceRoll('rav侦察50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d%: [2] = 2 ≤ 50 成功\n> 回复本条消息以进行对抗')
  })

  test('对抗标记无效', () => {
    const roller = createDiceRoll('v侦察', context)
    expect(roller.output).not.toMatch(/回复本条消息以进行对抗$/)
  })

  test('对抗标记无效2', () => {
    const roller = createDiceRoll('vx2侦察50', context)
    expect(roller.output).not.toMatch(/回复本条消息以进行对抗$/)
  })

  test('inline', () => {
    const roller = createDiceRoll('d[[d100]]', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d100: [2] = 2\n最后 🎲 d2: [2] = 2')
  })

  test('inline 嵌套', () => {
    const roller = createDiceRoll('d[[d[[d100]]]]', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d100: [2] = 2\n然后 🎲 d2: [2] = 2\n最后 🎲 d2: [2] = 2')
  })

  test('inline 引用', () => {
    const roller = createDiceRoll('[[d10]]d10+[[$1+1]]d6', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d10: [2] = 2\n然后 🎲 2+1: 2+1 = 3\n最后 🎲 2d10+3d6: [2, 2]+[2, 2, 2] = 10')
  })

  test('inline 嵌套 flags', () => {
    const roller = createDiceRoll('rx[[d4]]', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 d4: [2] = 2\n最后 🎲\nd100: [2] = 2\nd100: [2] = 2')
  })

  test('组合检定', () => {
    const roller = createDiceRoll('侦察60聆听70', context)
    expect(roller.output).toBe('Maca 🎲 侦察，聆听 d100: [2] = 2\n侦察 2 ≤ 60 成功\n聆听 2 ≤ 70 成功')
  })

  test('组合检定无效', () => {
    const roller = createDiceRoll('侦察，聆听', context)
    expect(roller.output).toBe('Maca 🎲 侦察，聆听 d100: [2] = 2')
  })

  test('组合检定部分', () => {
    const roller = createDiceRoll('侦察60聆听', context)
    expect(roller.output).toBe('Maca 🎲 侦察，聆听 d100: [2] = 2\n侦察 2 ≤ 60 成功')
  })
})

describe('已关联人物卡', () => {
  const context: IDiceRollContext = {
    channelId: 'abc123',
    userId: 'abc456',
    username: 'Maca',
    userRole: 'admin',
    config: new ChannelConfig(getInitialDefaultConfig()),
    getCard: () => new CocCard(getCardProto())
  }

  test('检定', () => {
    const roller = createDiceRoll('d100 侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 40 成功')
  })

  test('默认骰检定', () => {
    const roller = createDiceRoll('d侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 40 成功')
  })

  test('默认骰检定2', () => {
    const roller = createDiceRoll('侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 40 成功')
  })

  test('忽略临时值', () => {
    const roller = createDiceRoll('d100 侦察 50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 40 成功')
  })

  test('不存在技能仅回显', () => {
    const roller = createDiceRoll('不存在技能', context)
    expect(roller.output).toBe('Maca 🎲 不存在技能 d100: [2] = 2')
  })

  test('人物卡引用', () => {
    const roller = createDiceRoll('3d100<=$力量', context)
    expect(roller.output).toBe('Maca 🎲 3d100<=60: [2*, 2*, 2*] = 3')
  })

  test('人物卡引用使用大括号', () => {
    const roller = createDiceRoll('${力量}+${理智}', context)
    expect(roller.output).toBe('Maca 🎲 60+30: 60+30 = 90')
  })

  test('直接引用表达式', () => {
    const roller = createDiceRoll('徒手格斗', context)
    expect(roller.output).toBe('Maca 🎲 徒手格斗\n先是 🎲 db 0: 0 = 0\n最后 🎲 1d3+0: [2]+0 = 2')
  })

  test('描述不应解析为表达式', () => {
    const roller = createDiceRoll('d% 徒手格斗', context)
    expect(roller.output).toBe('Maca 🎲 徒手格斗 d%: [2] = 2')
  })

  test('表达式内嵌', () => {
    const roller = createDiceRoll('$徒手格斗+1d6+1', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 db 0: 0 = 0\n然后 🎲 徒手格斗 1d3+0: [2]+0 = 2\n最后 🎲 2+1d6+1: 2+[2]+1 = 5')
  })

  test('组合检定', () => {
    const roller = createDiceRoll('侦察 图书馆', context)
    expect(roller.output).toBe('Maca 🎲 侦察，图书馆 d100: [2] = 2\n侦察 2 ≤ 40 成功\n图书馆 2 ≤ 70 成功')
  })
})

function getCardProto(): ICard {
  return {
    type: 'coc',
    version: 16,
    basic: {
      name: '铃木翼',
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
      skillGrowth: {},
      lastModified: Date.now()
    }
  }
}

export {}

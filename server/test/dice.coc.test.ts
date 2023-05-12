import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
import { ICard } from '../../interface/card/types'
import { createDiceRoll, IDiceRollContext } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'
import { CocCard, ICocCardData } from '../../interface/card/coc'
import { VERSION_CODE } from '../../interface/version'

// use a custom engine
NumberGenerator.generator.engine = {
  next() {
    return 1
  }
}

const MockChannelId = '__mock_channel_id__'
const MockUserId = '__mock_user_id__'

function createContext(card: ICard): IDiceRollContext {
  return {
    channelId: MockChannelId,
    userId: MockUserId,
    username: 'Maca',
    userRole: 'admin',
    config: new ChannelConfig(getInitialDefaultConfig()),
    getCard: () => card
  }
}

describe('已关联COC人物卡', () => {
  // 生成一个通用的只读 config，用于大部分的情况
  const context = createContext(new CocCard(getCardProto()))

  test('检定', () => {
    const roller = createDiceRoll('d100 侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 40 成功')
  })

  test('默认骰检定', () => {
    const roller = createDiceRoll('d侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d%: [2] = 2 ≤ 40 成功')
  })

  test('默认骰检定2', () => {
    const roller = createDiceRoll('侦察', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d%: [2] = 2 ≤ 40 成功')
  })

  test('忽略临时值', () => {
    const roller = createDiceRoll('d100 侦察 50', context)
    expect(roller.output).toBe('Maca 🎲 侦察 d100: [2] = 2 ≤ 40 成功')
  })

  test('不存在技能仅回显', () => {
    const roller = createDiceRoll('不存在技能', context)
    expect(roller.output).toBe('Maca 🎲 不存在技能 d%: [2] = 2')
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
    expect(roller.output).toBe('Maca 🎲 侦察，图书馆 d%: [2] = 2\n侦察 2 ≤ 40 成功\n图书馆 2 ≤ 70 成功')
  })

  test('coc理智检定 默认骰', () => {
    const roller = createDiceRoll('sc', context)
    expect(roller.output).toBe('Maca 🎲 d% = 2 ≤ 30 成功\nMaca 🎲 理智损失 0: 0 = 0')
  })

  test('coc理智检定', () => {
    const roller = createDiceRoll('sc 0/d10', context)
    expect(roller.output).toBe('Maca 🎲 d% = 2 ≤ 30 成功\nMaca 🎲 理智损失 0: 0 = 0')
  })

  test('coc理智检定 inline 嵌套', () => {
    const roller = createDiceRoll('sc[[1d10]]/[[$1+1]]', context)
    expect(roller.output).toBe('Maca 🎲 d% = 2 ≤ 30 成功\nMaca 🎲 理智损失 2: 2 = 2')
  })

  test('coc成长检定 列出', () => {
    const context = createContext(new CocCard(getCardProto()))
    const initRoll = createDiceRoll('侦查', context)
    initRoll.applyToCard()
    const roller = createDiceRoll('enl', context)
    expect(roller.output).toBe('Maca 当前可成长的技能：\n侦查')
  })

  test('coc成长检定 全部', () => {
    const context = createContext(new CocCard(getCardProto()))
    const initRoll = createDiceRoll('侦查', context)
    initRoll.applyToCard()
    const roller = createDiceRoll('en', context)
    expect(roller.output).toBe('Maca 🎲 技能成长：\n🎲 侦查 d% = 2 ≤ 40 失败')
  })

  test('coc成长检定 指定技能', () => {
    const roller = createDiceRoll('en图书馆', context)
    expect(roller.output).toBe('Maca 🎲 技能成长：\n🎲 图书馆 d% = 2 ≤ 70 失败')
  })

  test('st 展示指定技能', () => {
    const roller = createDiceRoll('st show 侦查', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼): 侦查40`)
  })

  test('st 未指定', () => {
    const roller = createDiceRoll('st', context)
    expect(roller.output).toBe(`<@!${MockUserId}>请指定想要设置的属性名与属性值`)
  })

  test('st 修改', () => {
    const roller = createDiceRoll('st 侦查+10', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼) 设置 侦查 40+10: 40+10 = 50`)
  })

  test('st 批量新增', () => {
    const roller = createDiceRoll('st 拉拉20，打架30', context)
    expect(roller.output).toBe(`<@!${MockUserId}>(铃木翼) 设置:\n拉拉=20 打架=30`)
  })

  test('coc 先攻默认骰', () => {
    const roller = createDiceRoll('ri', context)
    expect(roller.output).toBe('Maca 🎲 先攻 60: 60 = 60')
  })
})

function getCardProto(): ICocCardData {
  return {
    type: 'coc',
    version: VERSION_CODE,
    name: '铃木翼',
    lastModified: Date.now(),
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

export {}

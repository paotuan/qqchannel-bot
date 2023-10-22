import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
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

describe('特殊解析规则', () => {
  const config = getInitialDefaultConfig()
  config.parseRule.convertCase = true
  config.parseRule.detectCardEntry = true
  config.parseRule.detectDefaultRoll = true

  const context: IDiceRollContext = {
    channelId: MockChannelId,
    userId: MockUserId,
    username: 'Maca',
    userRole: 'admin',
    config: new ChannelConfig(config),
    getCard: () => new CocCard(getCardProto()),
  }

  test('不区分大小写', () => {
    const roller = createDiceRoll('1D100', context)
    expect(roller.output).toBe('Maca 🎲 1d100: [2] = 2')
  })

  test('不区分大小写-不影响 dF', () => {
    const roller = createDiceRoll('4dF+1', context)
    expect(roller.output).toBe('Maca 🎲 4dF+1: [0, 0, 0, 0]+1 = 1')
  })

  test('自动检测 entry', () => {
    const result = context.config.detectCardEntry('1d3+力量', context.getCard(MockUserId))
    expect(result).toBe('1d3+$力量')
  })

  test('自动检测 ability', () => {
    const result = context.config.detectCardEntry('1d3+db', context.getCard(MockUserId))
    expect(result).toBe('1d3+$db')
  })

  test('自动检测-在开头', () => {
    const result = context.config.detectCardEntry('db+1d3', context.getCard(MockUserId))
    expect(result).toBe('$db+1d3')
  })

  test('自动检测-不检测整体 ability/entry', () => {
    const result = context.config.detectCardEntry('db', context.getCard(MockUserId))
    expect(result).toBe('db')
  })

  test('自动检测-不检测描述1', () => {
    const result = context.config.detectCardEntry('d100侦察', context.getCard(MockUserId))
    expect(result).toBe('d100侦察')
  })

  test('自动检测-不检测描述2', () => {
    const result = context.config.detectCardEntry('d100 侦察', context.getCard(MockUserId))
    expect(result).toBe('d100 侦察')
  })

  test('自动检测-不检测 Describing Rolls', () => {
    const result = context.config.detectCardEntry('d20+{3}[力量]+{2}[熟练]', context.getCard(MockUserId))
    expect(result).toBe('d20+{3}[力量]+{2}[熟练]')
  })

  test('自动检测-掷骰', () => {
    const roller = createDiceRoll('1d3+db', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 db 0: 0 = 0\n最后 🎲 1d3+0: [2]+0 = 2')
  })

  test('默认骰检测-原有逻辑', () => {
    const result = context.config.detectDefaultRollCalculation('rd', context.getCard(MockUserId))
    expect(result).toBe('rd')
  })

  test('默认骰检测-1', () => {
    const result = context.config.detectDefaultRollCalculation('rd+1', context.getCard(MockUserId))
    expect(result).toBe('d%+1')
  })

  test('默认骰检测-2', () => {
    const result = context.config.detectDefaultRollCalculation('1+r+d', context.getCard(MockUserId))
    expect(result).toBe('1+d%+d%')
  })

  test('综合', () => {
    const roller = createDiceRoll('R1D100+D+Db+1', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 db 0: 0 = 0\n最后 🎲 1d100+d%+0+1: [2]+[2]+0+1 = 5')
  })
})

function getCardProto(): ICocCardData {
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

export {}

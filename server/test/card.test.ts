// 人物卡测试：getEntry，getAbility，别名，读取属性优先级，人物卡展示
import {
  getCocCardProto,
  getDndCardProto,
  getGeneralCardProto,
  MockChannelId,
  MockUserId,
  resetRandomEngine
} from './utils'
import { GeneralCard } from '../../interface/card/general'
import { CocCard } from '../../interface/card/coc'
import { ICard } from '../../interface/card/types'
import { createDiceRoll, IDiceRollContext } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'
import { DndCard } from '../../interface/card/dnd'

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

describe('人物卡-coc', () => {
  let card: CocCard

  beforeEach(() => {
    card = new CocCard(getCocCardProto())
    resetRandomEngine(1)
  })

  test('getAbility-内置', () => {
    const db = card.getAbility('db')
    expect(db).toEqual({ input: 'db', key: 'DB', readonly: true, value: '0' })
  })

  test('getAbility-用户输入', () => {
    const ability = card.getAbility('徒手格斗')
    expect(ability).toEqual({ input: '徒手格斗', key: '徒手格斗', readonly: false, value: '1d3+$db' })
  })

  test('getAbility-用户输入优先级高于内置', () => {
    card.data.abilities.push({ name: 'db', expression: '1d10', ext: '' })
    const db = card.getAbility('db')
    expect(db).toEqual({ input: 'db', key: 'db', readonly: false, value: '1d10' })
    const context = createContext(card)
    const roller = createDiceRoll('1d3+$db', context)
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 db 1d10: [2] = 2\n最后 🎲 1d3+2: [2]+2 = 4')
  })

  test('getEntry-内置', () => {
    const db = card.getEntry('体格')
    expect(db).toEqual({ input: '体格', key: '体格', readonly: true, value: 0, baseValue: 0, difficulty: 'normal', type: 'basic', isTemp: false })
  })

  test('getEntry-用户输入', () => {
    const db = card.getEntry('困难图书馆')
    expect(db).toEqual({ input: '图书馆', key: '图书馆', readonly: false, value: 35, baseValue: 70, difficulty: 'hard', type: 'skills', isTemp: false })
  })

  test('getEntry-用户输入高于内置', () => {
    card.data.skills['体格'] = 5
    const db = card.getEntry('体格')
    expect(db).toEqual({ input: '体格', key: '体格', readonly: false, value: 5, baseValue: 5, difficulty: 'normal', type: 'skills', isTemp: false })
    const context = createContext(card)
    const roller = createDiceRoll('1d3+$体格', context)
    expect(roller.output).toBe('Maca 🎲 1d3+5: [2]+5 = 7')
  })

  test('setEntry-用户输入高于内置', () => {
    card.setEntry('体格', 5)
    const db = card.getEntry('体格')
    expect(db).toEqual({ input: '体格', key: '体格', readonly: false, value: 5, baseValue: 5, difficulty: 'normal', type: 'skills', isTemp: false })
  })

  test('展示描述', () => {
    expect(card.getSummary()).toBe('角色：铃木翼\n生命:10/12 理智:30/99 幸运:50 魔法:10/12 克苏鲁神话:0 信用评级:0\n力量:60 体质:60 体型:60 敏捷:60 外貌:60 智力:60 意志:60 教育:60\n侦查:40 图书馆:70\n徒手格斗:1d3+$db')
  })
})

describe('人物卡-dnd', () => {
  let card: DndCard

  beforeEach(() => {
    card = new DndCard(getDndCardProto())
    resetRandomEngine(1)
  })

  test('getEntry-内置', () => {
    const db = card.getEntry('力量')
    expect(db).toEqual({ input: '力量', key: '力量', value: 17, type: 'props', isTemp: false, postfix: 'none' })
  })

  test('getEntry-用户输入高于内置', () => {
    card.data.items['力量'] = 99
    const db = card.getEntry('力量')
    expect(db).toEqual({ input: '力量', key: '力量', value: 99, type: 'items', isTemp: false, postfix: 'none' })
  })

  test('展示描述', () => {
    expect(card.getSummary()).toBe('角色：铃木翼\n生命:12/12 LV:1 AC:12\n力量*:17 敏捷:14 体质*:15 智力:12 感知:10 魅力:8\n运动*:5(0) 体操:2(0) 巧手:2(0) 隐匿:2(0) 奥秘:1(0) 历史:1(0) 调查:1(0) 自然:1(0) 宗教:1(0) 驯兽:0(0) 洞悉:0(0) 医疗:0(0) 察觉:0(0) 生存:0(0) 欺瞒:-1(0) 威吓:-1(0) 表演:-1(0) 说服:-1(0)\nCP:0 SP:0 GP:0 EP:0 PP:0')
  })
})

describe('人物卡-general', () => {
  test('展示描述', () => {
    const card = new GeneralCard(getGeneralCardProto())
    expect(card.getSummary()).toBe('角色：铃木翼\n力量:60 体质:60\n徒手格斗:1d3+$db')
  })
})

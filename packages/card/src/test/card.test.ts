// 人物卡测试：getEntry，getAbility，别名，读取属性优先级，人物卡展示
import { describe, expect, test, beforeEach } from 'vitest'
import { GeneralCard, CocCard, DndCard, createCardForImport, CardProto } from '../index'
import { cloneDeep } from 'lodash'

describe('人物卡-coc', () => {
  let card: CocCard

  beforeEach(() => {
    const cardData = cloneDeep(CardProto.coc)
    card = createCardForImport(cardData, '铃木翼', false, card => {
      const cardData = card.data
      cardData.props.力量 = 60
      cardData.props.体质 = 60
      cardData.props.体型 = 60
      cardData.props.敏捷 = 60
      cardData.props.外貌 = 60
      cardData.props.智力 = 60
      cardData.props.意志 = 60
      cardData.props.教育 = 60
      cardData.basic.LUCK = 50
      cardData.skills.侦查 = 40
      cardData.skills.图书馆 = 70
      cardData.abilities.push({ name: '徒手格斗', expression: '1d3+$db', ext: '' })
    })
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
  })

  test('setEntry-用户输入高于内置', () => {
    card.setEntry('体格', 5)
    const db = card.getEntry('体格')
    expect(db).toEqual({ input: '体格', key: '体格', readonly: false, value: 5, baseValue: 5, difficulty: 'normal', type: 'skills', isTemp: false })
  })

  test('展示描述', () => {
    expect(card.getSummary()).toBe(`角色：铃木翼
生命:12/12 理智:60/99 幸运:50 魔法:12/12 克苏鲁神话:0 信用评级:0
力量:60 体质:60 体型:60 敏捷:60 外貌:60 智力:60 意志:60 教育:60
会计:5 人类学:1 估价:5 考古学:1 取悦:15 攀爬:20 计算机:5 乔装:5 驾驶:20 电气维修:10 电子学:1 话术:5 急救:30 历史:5 恐吓:15 跳跃:20 法律:5 图书馆:70 聆听:20 锁匠:1 机械维修:10 医学:1 博物:10 导航:10 神秘学:5 克苏鲁:0 重型机械:1 说服:10 精神分析:1 心理学:10 骑乘:5 妙手:10 侦查:40 潜行:20 游泳:20 投掷:20 追踪:10 驯兽:5 潜水:1 爆破:1 读唇:1 催眠:1 炮术:1 鞭:5 刀剑:20 斗殴:25 斧:15 绞索:15 连枷:10 链锯:10 步枪:25 冲锋枪:15 弓:15 矛:20 火焰喷射器:10 机枪:10 手枪:20 霰弹枪:25 重武器:10 表演:5 美术:5 摄影:5 伪造文书:5 地质学:1 动物学:1 化学:1 密码学:1 气象学:1 生物学:1 数学:10 司法科学:1 天文学:1 物理学:1 药学:1 植物学:1 闪避:30 母语:60
徒手格斗:1d3+$db`)
  })
})

describe('人物卡-dnd', () => {
  let card: DndCard

  beforeEach(() => {
    const cardData = cloneDeep(CardProto.dnd)
    card = createCardForImport(cardData, '铃木翼', false, card => {
      const cardData = card.data
      cardData.props.力量 = 17
      cardData.props.敏捷 = 14
      cardData.props.体质 = 15
      cardData.props.智力 = 12
      cardData.props.感知 = 10
      cardData.props.魅力 = 8
      cardData.equips.push({ name: '战斧命中', expression: 'd20+$力量调整+$熟练', ext: '' })
      cardData.equips.push({ name: '战斧', expression: '1d8+$力量调整', ext: '' })
      cardData.meta.experienced.力量 = true
      cardData.meta.experienced.体质 = true
      cardData.meta.experienced.运动 = true
    })
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
    expect(card.getSummary()).toBe('角色：铃木翼\n生命:10/10 LV:1 AC:10\n力量*:17 敏捷:14 体质*:15 智力:12 感知:10 魅力:8\n运动*:5(0) 体操:2(0) 巧手:2(0) 隐匿:2(0) 奥秘:1(0) 历史:1(0) 调查:1(0) 自然:1(0) 宗教:1(0) 驯兽:0(0) 洞悉:0(0) 医疗:0(0) 察觉:0(0) 生存:0(0) 欺瞒:-1(0) 威吓:-1(0) 表演:-1(0) 说服:-1(0)\nCP:0 SP:0 GP:0 EP:0 PP:0')
  })
})

describe('人物卡-general', () => {
  let card: GeneralCard

  beforeEach(() => {
    const cardData = cloneDeep(CardProto.general)
    card = createCardForImport(cardData, '铃木翼', false, card => {
      const cardData = card.data
      cardData.skills.力量 = 60
      cardData.skills.体质 = 60
      cardData.abilities.push({ key: '徒手格斗', value: '1d3+$db' })
    })
  })

  test('展示描述', () => {
    expect(card.getSummary()).toBe('角色：铃木翼\nHP:0 MAXHP:0 力量:60 体质:60\n徒手格斗:1d3+$db')
  })
})

import { describe, expect, test } from 'vitest'
import { cloneDeep } from 'lodash'
import { CardProto } from '../proto'
import { CocCard, createCardForImport } from '../index'

describe('人物卡创建', () => {
  test('根据模板初始化', () => {
    const cardData = cloneDeep(CardProto.coc)
    const card = createCardForImport<CocCard>(cardData, '铃木翼', false)
    // props 已被模板初始化
    expect(card.data.props.力量).toBeGreaterThan(0)
    // 模板初始化后，应删除模板信息，以避免这个人物卡后续转换成模板后，这些字段被二次初始化
    expect(card.data.templateData).toEqual({})
  })

  test('导入为模板', () => {
    const cardData = cloneDeep(CardProto.coc)
    const card = createCardForImport<CocCard>(cardData, '铃木翼', true)
    // props 不应触发模板初始化逻辑
    expect(card.data.props.力量).toBe(0)
    // 应保留模板信息
    expect(card.data.templateData).not.toEqual({})
  })

  test('模板不应覆盖已设置的值', () => {
    const cardData = cloneDeep(CardProto.coc)
    const card = createCardForImport<CocCard>(cardData, '铃木翼', false, card => {
      card.setEntry('力量', 999)
    })
    expect(card.data.props.力量).toBe(999)
  })

  test('coc 导入后初始化一些值', () => {
    const cardData = cloneDeep(CardProto.coc)
    const card = createCardForImport<CocCard>(cardData, '铃木翼', false)
    expect(card.HP).toBe(card.MAXHP)
    expect(card.MP).toBe(card.MAXMP)
    expect(card.SAN).toBe(card.data.props.意志)
    expect(card.data.skills.闪避).toBeGreaterThan(0)
    expect(card.data.skills.母语).toBeGreaterThan(0)
  })
})

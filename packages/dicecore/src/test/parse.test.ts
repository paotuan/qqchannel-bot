import { parseDescriptions2 } from '../dice/utils/parseDescription'

describe('组合检定表达式解析', () =>{
  test('表达式', () => {
    const res = parseDescriptions2('d100')
    expect(res).toEqual({ exp: 'd100', skills: [] })
  })

  test('技能名', () => {
    const res = parseDescriptions2('侦察')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN, modifiedValue: NaN }] })
  })

  test('技能名+临时值', () => {
    const res = parseDescriptions2('侦察60')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }] })
  })

  test('表达式+技能名', () => {
    const res = parseDescriptions2('d100侦察')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: NaN, modifiedValue: NaN }] })
  })

  test('表达式+技能名+临时值', () => {
    const res = parseDescriptions2('d100侦察60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }] })
  })

  test('表达式+临时值', () => {
    const res = parseDescriptions2('d100 60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '', tempValue: 60, modifiedValue: NaN }] })
  })

  test('元素之间允许空格', () => {
    const res = parseDescriptions2('d100 侦察60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }] })
  })

  test('元素之间允许空格2', () => {
    const res = parseDescriptions2('d100侦察 60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }] })
  })

  test('元素之间允许空格3', () => {
    const res = parseDescriptions2('d100 侦察 60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }] })
  })

  test('多个技能临时值', () => {
    const res = parseDescriptions2('d100侦察60聆听70')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }, { skill: '聆听', tempValue: 70, modifiedValue: NaN }] })
  })

  test('多个技能临时值无表达式', () => {
    const res = parseDescriptions2('侦察60聆听70')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }, { skill: '聆听', tempValue: 70, modifiedValue: NaN }] })
  })

  test('多个技能无临时值', () => {
    const res = parseDescriptions2('侦察 聆听')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN, modifiedValue: NaN }, { skill: '聆听', tempValue: NaN, modifiedValue: NaN }] })
  })

  test('多个技能无临时值，逗号分隔', () => {
    const res = parseDescriptions2('侦察, 聆听')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN, modifiedValue: NaN }, { skill: '聆听', tempValue: NaN, modifiedValue: NaN }] })
  })

  test('多个技能临时值空格', () => {
    const res = parseDescriptions2('侦察60 聆听 70')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: 60, modifiedValue: NaN }, { skill: '聆听', tempValue: 70, modifiedValue: NaN }] })
  })

  test('多个技能部分临时值', () => {
    const res = parseDescriptions2('侦察 聆听 70，图书馆80')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN, modifiedValue: NaN }, { skill: '聆听', tempValue: 70, modifiedValue: NaN }, { skill: '图书馆', tempValue: 80, modifiedValue: NaN }] })
  })

  test('调整值', () => {
    const res = parseDescriptions2('d100侦查+10')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦查', tempValue: NaN, modifiedValue: 10 }] })
  })

  test('调整值+临时值', () => {
    const res = parseDescriptions2('d100侦查60+10')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦查', tempValue: 60, modifiedValue: 10 }] })
  })

  test('单调整值, 无临时值', () => {
    const res = parseDescriptions2('d100 -10')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '', tempValue: NaN, modifiedValue: -10 }] })
  })
})

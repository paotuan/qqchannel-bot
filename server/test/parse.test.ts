import { parseDescriptions2 } from '../service/dice/utils'

describe('组合检定表达式解析', () =>{
  test('表达式', () => {
    const res = parseDescriptions2('d100')
    expect(res).toEqual({ exp: 'd100', skills: [] })
  })

  test('技能名', () => {
    const res = parseDescriptions2('侦察')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN }] })
  })

  test('技能名+临时值', () => {
    const res = parseDescriptions2('侦察60')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: 60 }] })
  })

  test('表达式+技能名', () => {
    const res = parseDescriptions2('d100侦察')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: NaN }] })
  })

  test('表达式+技能名+临时值', () => {
    const res = parseDescriptions2('d100侦察60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60 }] })
  })

  test('表达式+临时值（无效）', () => {
    const res = parseDescriptions2('d100 60')
    expect(res).toEqual({ exp: 'd100', skills: [] })
  })

  test('元素之间允许空格', () => {
    const res = parseDescriptions2('d100 侦察60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60 }] })
  })

  test('元素之间允许空格2', () => {
    const res = parseDescriptions2('d100侦察 60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60 }] })
  })

  test('元素之间允许空格3', () => {
    const res = parseDescriptions2('d100 侦察 60')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60 }] })
  })

  test('多个技能临时值', () => {
    const res = parseDescriptions2('d100侦察60聆听70')
    expect(res).toEqual({ exp: 'd100', skills: [{ skill: '侦察', tempValue: 60 }, { skill: '聆听', tempValue: 70 }] })
  })

  test('多个技能临时值无表达式', () => {
    const res = parseDescriptions2('侦察60聆听70')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: 60 }, { skill: '聆听', tempValue: 70 }] })
  })

  test('多个技能无临时值', () => {
    const res = parseDescriptions2('侦察 聆听')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN }, { skill: '聆听', tempValue: NaN }] })
  })

  test('多个技能无临时值，逗号分隔', () => {
    const res = parseDescriptions2('侦察, 聆听')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN }, { skill: '聆听', tempValue: NaN }] })
  })

  test('多个技能临时值空格', () => {
    const res = parseDescriptions2('侦察60 聆听 70')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: 60 }, { skill: '聆听', tempValue: 70 }] })
  })

  test('多个技能部分临时值', () => {
    const res = parseDescriptions2('侦察 聆听 70，图书馆80')
    expect(res).toEqual({ exp: '', skills: [{ skill: '侦察', tempValue: NaN }, { skill: '聆听', tempValue: 70 }, { skill: '图书馆', tempValue: 80 }] })
  })
})

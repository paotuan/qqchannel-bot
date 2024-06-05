import { beforeEach, describe, test, expect } from 'vitest'
import { IDiceRollContext } from '../dice/utils/parseTemplate'
import { getCocCardProto, MockChannelId, MockUserId, resetRandomEngine } from './utils'
import { CardProvider } from '../card/card-provider'
import path from 'path'
import { VERSION_CODE } from '../version'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'
import Mustache from 'mustache'
import { ConfigProvider } from '../config/config-provider'
import { IPlugin } from '@paotuan/config'
import { PluginProvider } from '../config/plugin-provider'
import _ from 'lodash'
import { dispatchCommand, IDispatchResult_Dice } from '../main/dispatch'
import { ChannelConfig } from '../config/config'

function createContext(): IDiceRollContext {
  return {
    userId: MockUserId,
    username: 'Maca',
    userRole: 'admin',
    channelUnionId: MockChannelId,
  }
}

function registerPlugins(names: string[]) {
  const plugins = names.map(pluginName => {
    const fullPath = path.join(__dirname, 'plugins', pluginName, 'index.js')
    const registerContext/*: IPluginRegisterContext*/ = {
      versionCode: VERSION_CODE,
      versionName: '',
      roll: exp => new DiceRoll(exp),
      render: (arg1, arg2, arg3) => Mustache.render(arg1, arg2, arg3, { escape: value => value }),
      getCard: ({ channelUnionId, userId }) => CardProvider.INSTANCE.getCard(channelUnionId, userId),
      saveCard: () => {},
      getLinkedCardUserList: ({ channelUnionId }) => Object.keys(CardProvider.INSTANCE.getLinkMap(channelUnionId)),
      linkCard: () => {}, // todo
      queryCard: q => CardProvider.INSTANCE.queryCard(q),
      sendMessageToChannel: async (env, msg, options) => {
        console.log('sendMessageToChannel', msg, options)
      },
      sendMessageToUser: async (env, msg, options) => {
        console.log('sendMessageToUser', msg, options)
      },
      getConfig: () => ConfigProvider.INSTANCE.defaultConfig.config,
      getPreference: () => ({}),
      dispatchUserCommand: async c => {
        console.log(c)
      },
      _
    }
    const plugin = require(fullPath)(registerContext) as IPlugin
    return plugin
  })
  PluginProvider.INSTANCE.register(plugins)
}

describe('实验性指令设置', () => {
  // let card: CocCard
  let context: IDiceRollContext
  let config: ChannelConfig

  beforeEach(() => {
    const cardData = getCocCardProto()
    CardProvider.INSTANCE.registerCard(cardData.name, cardData)
    CardProvider.INSTANCE.linkCard(MockChannelId, cardData.name, MockUserId)
    // card = CardProvider.INSTANCE.getCardById(cardData.name) as CocCard
    context = createContext()
    resetRandomEngine(1)
    // 注册插件
    registerPlugins(['io.paotuan.plugin.compatible'])
    // 默认开启
    Object.values(ConfigProvider.INSTANCE.defaultConfig.config.hookIds).forEach(arr => {
      arr.forEach(item => {
        item.enabled = true
      })
    })
    config = ConfigProvider.INSTANCE.defaultConfig
  })

  test('不区分大小写', async () => {
    const result = await dispatchCommand({ command: '1D100', context })
    const roller = (result as IDispatchResult_Dice).diceRoll
    expect(roller.output).toBe('Maca 🎲 1d100: [2] = 2')
  })

  test('不区分大小写-不影响 dF', async () => {
    const result = await dispatchCommand({ command: '4dF+1', context })
    const roller = (result as IDispatchResult_Dice).diceRoll
    expect(roller.output).toBe('Maca 🎲 4dF+1: [0, 0, 0, 0]+1 = 1')
  })

  test('自动检测 entry', () => {
    const diceCommand = { command: '1d3+力量', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('1d3+$力量')
  })

  test('自动检测 ability', () => {
    const diceCommand = { command: '1d3+db', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('1d3+$db')
  })

  test('自动检测-在开头', () => {
    const diceCommand = { command: 'db+1d3', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('$db+1d3')
  })

  test('自动检测-不检测整体 ability/entry', () => {
    const diceCommand = { command: 'db', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('db')
  })

  test('自动检测-不检测描述1', () => {
    const diceCommand = { command: 'd100侦察', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('d100侦察')
  })

  test('自动检测-不检测描述2', () => {
    const diceCommand = { command: 'd100 侦察', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('d100 侦察')
  })

  test('自动检测-不检测 Describing Rolls', () => {
    const diceCommand = { command: 'd20+{3}[力量]+{2}[熟练]', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('d20+{3}[力量]+{2}[熟练]')
  })

  test('自动检测-不检测 st', () => {
    const diceCommand = { command: 'st力量+1', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('st力量+1')
  })

  test('自动检测-掷骰', async () => {
    const result = await dispatchCommand({ command: '1d3+db', context })
    const roller = (result as IDispatchResult_Dice).diceRoll
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 db 0: 0 = 0\n最后 🎲 1d3+0: [2]+0 = 2')
  })

  test('默认骰检测-原有逻辑', () => {
    const diceCommand = { command: 'rd', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('rd')
  })

  test('默认骰检测-1', () => {
    const diceCommand = { command: 'rd+1', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('d%+1')
  })

  test('默认骰检测-2', () => {
    const diceCommand = { command: '1+r+d', context }
    config.hook_beforeParseDiceRoll(diceCommand)
    expect(diceCommand.command).toBe('1+d%+d%')
  })

  test('综合', async () => {
    const result = await dispatchCommand({ command: 'R1D100+D+Db+1', context })
    const roller = (result as IDispatchResult_Dice).diceRoll
    expect(roller.output).toBe('Maca 🎲\n先是 🎲 db 0: 0 = 0\n最后 🎲 1d100+d%+0+1: [2]+[2]+0+1 = 5')
  })
//
//   test('中间骰解析策略-1', () => {
//     context.config.config.parseRule.naiveInlineParseRule = true
//     const result = context.config.naiveParseInlineRolls('1d3+$db', context.getCard(MockUserId))
//     expect(result).toBe('1d3+(0)')
//   })
//
//   test('中间骰解析策略-2', () => {
//     context.config.config.parseRule.naiveInlineParseRule = true
//     const result = context.config.naiveParseInlineRolls('1d3+[[1d10+[[1+d6]]]]', context.getCard(MockUserId))
//     expect(result).toBe('1d3+(1d10+(1+d6))')
//   })
})

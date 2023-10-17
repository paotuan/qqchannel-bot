import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
import { createDiceRoll, IDiceRollContext } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'

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

  const context: IDiceRollContext = {
    channelId: MockChannelId,
    userId: MockUserId,
    username: 'Maca',
    userRole: 'admin',
    config: new ChannelConfig(config),
    getCard: () => undefined,
  }

  test('不区分大小写', () => {
    const roller = createDiceRoll('1D100', context)
    expect(roller.output).toBe('Maca 🎲 1d100: [2] = 2')
  })

  test('不区分大小写-不影响 dF', () => {
    const roller = createDiceRoll('4dF+1', context)
    expect(roller.output).toBe('Maca 🎲 4dF+1: [0, 0, 0, 0]+1 = 1')
  })
})

import { NumberGenerator } from '@dice-roller/rpg-dice-roller'
import type { IDiceRollContext } from '../service/dice/utils'
import { createDiceRoll } from '../service/dice/utils'
import { ChannelConfig } from '../service/config/config'
import { getInitialDefaultConfig } from '../service/config/default'

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
    expect(roller.output.trim()).toBe('Maca 🎲 d100: [2] = 2')
  })
})

export {}

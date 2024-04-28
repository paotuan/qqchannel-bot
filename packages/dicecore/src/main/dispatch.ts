import type { IUserCommand, IUserCommandContext } from '@paotuan/config'
import type { ICard, ICardEntryChangeEvent } from '@paotuan/card'
import { ConfigProvider } from '../config/config-provider'
import { BasePtDiceRoll, createDiceRoll, StandardDiceRoll } from '../dice'
import { eventBus } from '../utils/eventBus'
import type { ChannelConfig } from '../config/config'

export interface IDispatchOption {
  // skipCustomReply?: boolean
  getOpposedRoll?: (command: IUserCommand) => Promise<StandardDiceRoll | undefined>
  getReactionCommand?: (command: IUserCommand) => Promise<string | undefined>
}

export interface IDispatchResult_CustomReply {
  type: 'customReply'
  reply?: string // 可能处理出错
}

export interface IDispatchResult_Dice {
  type: 'dice',
  diceRoll?: BasePtDiceRoll,
  affectedCards?: ICard[]
}

export type IDispatchResult = IDispatchResult_CustomReply | IDispatchResult_Dice

/**
 * 处理用户输入
 */
export async function dispatchCommand(userCommand: IUserCommand, options: IDispatchOption = {}): Promise<IDispatchResult> {
  const { context, command } = userCommand
  const config = ConfigProvider.INSTANCE.getConfig(context.channelUnionId)

  // 注册监听器
  const cardEntryChangeListener = (event: ICardEntryChangeEvent) => {
    config.hook_onCardEntryChange({ event, context })
  }
  eventBus.on('card-entry-change', cardEntryChangeListener)

  try {
    // hook: OnReceiveCommandCallback 处理
    await config.hook_onReceiveCommand(userCommand)

    // 整体别名指令处理
    userCommand.command = config.parseAliasRoll_command(userCommand.command)

    // 自定义回复处理
    const [handled, reply] = await config.handleCustomReply(userCommand)
    if (handled) {
      return { type: 'customReply', reply }
    }

    // 是否有回复消息(目前仅用于对抗检定)
    const opposedRoll = await options.getOpposedRoll?.(userCommand)
    // 投骰
    return tryRollDice(config, command, context, opposedRoll)
  } finally {
    // 取消监听器
    eventBus.off('card-entry-change', cardEntryChangeListener)
  }
}

/**
 * 处理用户表情
 */
export async function dispatchReaction(userCommand: IUserCommand, options: IDispatchOption = {}): Promise<IDispatchResult | undefined> {
  const { context } = userCommand
  const config = ConfigProvider.INSTANCE.getConfig(context.channelUnionId)

  // 注册监听器
  const cardEntryChangeListener = (event: ICardEntryChangeEvent) => {
    config.hook_onCardEntryChange({ event, context })
  }
  eventBus.on('card-entry-change', cardEntryChangeListener)

  try {
    // hook: OnMessageReaction 处理
    const handled = await config.hook_onMessageReaction({ context })
    // 这里给个特殊逻辑，如果由插件处理过，就不走默认的逻辑了（自动检测技能检定），否则会显得奇怪
    if (handled) return undefined

    // 投骰
    const command = await options.getReactionCommand?.(userCommand)
    if (!command) return undefined
    const opposedRoll = await options.getOpposedRoll?.(userCommand)
    return tryRollDice(config, command, context, opposedRoll)
  } finally {
    // 取消监听器
    eventBus.off('card-entry-change', cardEntryChangeListener)
  }
}

function tryRollDice(config: ChannelConfig, command: string, context: IUserCommandContext, opposedRoll?: StandardDiceRoll): IDispatchResult_Dice {
  try {
    const { channelUnionId, userId, username, userRole } = context
    const roller = createDiceRoll(
      command,
      { channelUnionId, userId, username, userRole, opposedRoll },
      {
        before: roll => config.hook_beforeDiceRoll(roll),
        after: roll => config.hook_afterDiceRoll(roll)
      }
    )
    // 保存人物卡更新
    const affectedCards = roller.applyToCard()
    return { type: 'dice', diceRoll: roller, affectedCards }
  } catch (e: any) {
    // 表达式不合法，无视之
    console.log('[Dice] 未识别表达式', e?.message)
    return { type: 'dice' }
  }
}

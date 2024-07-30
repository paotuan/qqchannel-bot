import { Bot } from '../adapter/Bot'
import type { ICommand, BotContext, UserRole } from '@paotuan/config'
import { Session, Element } from '../adapter/satori'
import { getChannelUnionId } from '../adapter/utils'

export class UserCommand implements ICommand<BotContext> {

  readonly session: Session
  command: string
  private readonly substitute: BotContext['realUser'] | undefined
  private readonly bot: Bot
  [key: string | number | symbol]: unknown

  private constructor(bot: Bot, session: Session, command: string, substitute: BotContext['realUser'] | undefined) {
    this.session = session
    this.command = command
    this.substitute = substitute
    this.bot = bot
  }

  get botId() {
    return this.bot.id
  }

  get platform() {
    return this.bot.platform
  }

  get realUser() {
    const session = this.session
    const author = session.author
    // 适配部分情况下接口不返回昵称的情况（例如 kook 表情表态）
    let username = author.nick ?? author.nickname ?? author.name ?? author.username
    if (typeof username === 'undefined') {
      const user = this.bot.guilds.findUser(session.userId, session.guildId)
      if (user) username = user.name
    }
    return {
      userId: session.userId,
      username: username || session.userId
    }
  }

  get guildId() {
    const session = this.session
    if (session.isDirect) {
      if (this.platform === 'qqguild') {
        // qq 频道提取私信机器人所在的 src guild
        return session.guildId.split('_')[0]
      } else if (this.platform === 'kook') {
        // kook 无私信频道概念，兜底留个空字符串
        return session.guildId || ''
      }
    }
    return session.guildId
  }

  get channelId() {
    const session = this.session
    if (session.isDirect) {
      return session.channelId.split('_')[1]
    } else {
      return session.channelId
    }
  }

  get context(): ICommand<BotContext>['context'] {
    const session = this.session
    const substitute = this.substitute
    const realUser = this.realUser
    return {
      botId: this.botId,
      userId: substitute?.userId ?? realUser.userId,
      username: substitute?.username ?? realUser.username,
      userRole: convertRoleIds(session.author.roles),
      msgId: session.messageId,
      platform: this.platform,
      guildId: this.guildId,
      channelId: this.channelId,
      channelUnionId: getChannelUnionId(this.platform, this.guildId, this.channelId),
      replyMsgId: session.event.message?.quote?.id,
      isDirect: session.isDirect,
      realUser
    }
  }
  //
  // clone() {
  //   const newCommand = new UserCommand(this.bot, this.session, this.command, this.substitute)
  //   for (const key of Reflect.ownKeys(this)) {
  //     if (['session', 'command', 'substitute', 'bot'].includes(key as string)) continue
  //     newCommand[key] = this[key]
  //   }
  //   return newCommand
  // }

  static fromMessage(bot: Bot, session: Session) {
    try {
      // 无视非文本消息
      const elements = Element.transform(session.elements, ({ type, attrs }) => {
        if (type === 'at') {
          return true
        } else if (type === 'text') {
          return !!attrs.content.trim()
        } else {
          return false
        }
      }, session)
      if (elements.length === 0) throw new Error()

      // 提取出指令体，无视非指令消息
      const botUserId = bot.botInfo?.id
      let isInstruction = false
      // @机器人的消息
      if (botUserId && elements[0].type === 'at' && elements[0].attrs.id === botUserId) {
        isInstruction = true
        elements.splice(0, 1)
      }

      // 指令消息. 自定义回复建议使用 qq 频道原生指令前缀 “/”
      const firstElem = elements[0]
      if (firstElem && firstElem.type === 'text') {
        let firstSpan = firstElem.attrs.content.trimStart()
        if (firstSpan.startsWith('/') || firstSpan.startsWith('.') || firstSpan.startsWith('。')) {
          isInstruction = true
          firstSpan = firstSpan.substring(1)
          firstElem.attrs.content = firstSpan
        }
      }

      if (!isInstruction) throw new Error()

      // 是否是全局代骰
      let substitute: BotContext['realUser'] | undefined = undefined
      const lastElem = elements.at(-1)
      if (lastElem && lastElem.type === 'at') {
        const userId = lastElem.attrs.id
        const user = bot.guilds.findUser(userId, session.guildId) // 一般不会在私信用到，可以直接使用 session.guildId
        const username = user?.name ?? userId
        substitute = { userId, username }
        elements.splice(-1, 1)
      }

      const fullExp = elements.map(elem => elem.toString()).join('').trim()

      // 支持纯文本 @xx 形式的代骰，可以 @人物卡名 或 @用户昵称。昵称无需打全，但有且只有唯一匹配的时候才生效
      // 注意目前代骰记录的是 userId，因此 @人物卡名 也只能支持已关联了玩家的人物卡。对于其他人物卡代骰将在后续优化
      // 同理由于涉及关联关系，在私信中不能应用这段逻辑
      if (!substitute && !session.isDirect) {
        const manualAtIndex = fullExp.lastIndexOf('@')
        if (manualAtIndex >= 0 && manualAtIndex < fullExp.length - 1) {
          const search = fullExp.slice(manualAtIndex + 1).toLowerCase()
          // 先查找人物卡名，毕竟如果要 at 用户，（除了 qq 群）用正常的 at 就可以了
          const userId = queryUserIdFromCard(search, bot, session)
          if (userId) {
            const user = bot.guilds.findUser(userId, session.guildId)
            const username = user?.name ?? userId
            substitute = { userId, username }
          }
          // 再查找用户名
          if (!substitute) {
            const users = bot.guilds.queryUser({ name: search }, session.guildId)
            const exactUser = users.find(u => u.name === search)
            if (exactUser) {
              substitute = { userId: exactUser.id, username: exactUser.name }
            } else if (users.length === 1) {
              substitute = { userId: users[0].id, username: users[0].name }
            }
          }
        }
      }

      return new UserCommand(bot, session, fullExp, substitute)
    } catch (e) {
      return undefined
    }
  }

  static fromReaction(bot: Bot, session: Session) {
    return new UserCommand(bot, session, '', undefined)
  }
}

// 用户权限 id 适配
// https://bot.q.qq.com/wiki/develop/nodesdk/model/role.html#DefaultRoleIDs
// todo kook 场景
function convertRoleIds(ids: string[] = []): UserRole {
  if (ids.includes('4')) {
    return 'admin'
  } else if (ids.includes('2') || ids.includes('5')) {
    return 'manager'
  } else {
    return 'user'
  }
}


function queryUserIdFromCard(search: string, bot: Bot, session: Session) {
  const channelUnionId = getChannelUnionId(bot.platform, session.guildId, session.channelId)
  // userId -> cardId
  const linkedMap = bot.wss.cards.getLinkMap(channelUnionId)
  const linedCardIds = Object.values(linkedMap)
  // 我们需要的只是名字，因此无需调用 queryCard，直接从已关联的人物卡名字中查询
  const keyword = search // .toLowerCase() 外部已经 toLowerCase
  const availableNames = linedCardIds.filter(name => name.toLowerCase().includes(keyword))
  let foundCard: string | undefined
  const exactCard = availableNames.find(name => name.toLowerCase() === keyword)
  if (exactCard) {
    foundCard = exactCard
  } else if (availableNames.length === 1) {
    foundCard = availableNames[0]
  }
  if (!foundCard) return undefined
  // 确定了人物卡后，反查人物卡对应的用户
  for (const userId of Object.keys(linkedMap)) {
    if (linkedMap[userId] === foundCard) {
      return userId
    }
  }
  return undefined
}

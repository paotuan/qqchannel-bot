import { Bot } from '../adapter/Bot'
import type { ICommand, BotContext, UserRole } from '@paotuan/config'
import { Session, Element } from '../adapter/satori'
import { ChannelUnionId, getChannelUnionId } from '../adapter/utils'
import { ICard } from '@paotuan/card'
import { MockSystemUserId } from '@paotuan/dicecore'

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
      if (session.guildId) {
        const user = this.bot.guilds.findUser(session.userId, session.guildId)
        username = user.name
      } else {
        // 无 guildId，通常为私信场景，从全部 guild 中找一个能用的昵称
        const users = this.bot.guilds.findUserInAllGuilds(session.userId)
        for (const user of users) {
          if (user.name && user.name !== user.id) {
            username = user.name
            break
          }
        }
      }
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
      } else {
        // 其余平台私信无频道概念，留空
        return ''
      }
    }
    return session.guildId
  }

  get channelId() {
    const session = this.session
    if (session.isDirect) {
      return '' // 私信场景留空
    }
    return session.channelId
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
      // channelUnionId 私信场景，与其每个平台都产生不可预测的行为，不如统一置空
      // 使用 ICommand 接口时便可通过是否含有 channelUnionId 区分是否为私信场景
      // 如果后续有对私信场景做比较重的处理，可以再考虑设计私信场景 id 的组装方式
      channelUnionId: session.isDirect ? '' : getChannelUnionId(this.platform, this.guildId, this.channelId),
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

      let fullExp = elements.map(elem => elem.toString()).join('').trim()
      // 支持纯文本 @xx 形式的代骰，可以 @人物卡名 或 @用户昵称。人物卡名或昵称无需打全，但有且只有唯一匹配的时候才生效
      // 同理由于涉及关联关系，在私信中不能应用这段逻辑
      if (!substitute && !session.isDirect) {
        const manualAtIndex = fullExp.lastIndexOf('@')
        if (manualAtIndex >= 0 && manualAtIndex < fullExp.length - 1) {
          const search = fullExp.slice(manualAtIndex + 1).toLowerCase()
          // 先查找人物卡名，毕竟如果要 at 用户，（除了 qq 群）用正常的 at 就可以了
          substitute = querySubstituteFromCard(search, bot, session)
          // 再查找用户名
          if (!substitute) {
            substitute = _findUniqueUser(search, bot, session)
          }
        }
        // 如查找到代骰，消息内容移除代骰部分
        if (substitute) {
          fullExp = fullExp.slice(0, manualAtIndex)
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

// 根据人物卡名称，构造纯文本形式的代骰
function querySubstituteFromCard(search: string, bot: Bot, session: Session) {
  const foundCard = _findUniqueCard(search, bot)
  if (!foundCard) return undefined
  // 如果 card 已关联了某个玩家，则优先视为为这个玩家代骰。与非纯文本代骰的逻辑保持一致
  const channelUnionId = getChannelUnionId(bot.platform, session.guildId, session.channelId)
  const user = _findLinkedUserOfCard(foundCard, bot, session, channelUnionId)
  if (user) return user
  // 如果 card 未关联玩家，则将它分配到一个虚拟的 user 上
  bot.wss.cards.linkCard(channelUnionId, foundCard.name, MockSystemUserId)
  return { userId: MockSystemUserId, username: foundCard.name }
}

// 搜索是否有唯一匹配的人物卡
function _findUniqueCard(search: string, bot: Bot) {
  const keyword = search // .toLowerCase() 外部已经 toLowerCase
  const cards = bot.wss.cards.queryCard({ name: keyword, isTemplate: false })
  if (cards.length === 0) return undefined // 没有对应名字的卡片
  let foundCard: ICard | undefined
  if (cards.length === 1) {
    foundCard = cards[0]
  } else {
    // 是否有唯一匹配
    const exactCard = cards.find(card => card.name.toLowerCase() === keyword)
    if (exactCard) foundCard = exactCard
  }
  return foundCard
}

// 根据人物卡反查是否有关联的玩家
function _findLinkedUserOfCard(card: ICard, bot: Bot, session: Session, channelUnionId: ChannelUnionId) {
  // userId -> cardId
  const linkedMap = bot.wss.cards.getLinkMap(channelUnionId)
  let userId: string | undefined
  for (const _userId of Object.keys(linkedMap)) {
    if (linkedMap[_userId] === card.name) {
      userId = _userId
      break
    }
  }
  if (!userId) return undefined
  // 若有关联玩家，查询对应的 username
  const user = bot.guilds.findUser(userId, session.guildId)
  const username = user?.name ?? userId
  return { userId, username }
}

// 搜索是否有唯一匹配的用户名
function _findUniqueUser(search: string, bot: Bot, session: Session) {
  // search 外部已经 toLowerCase
  const users = bot.guilds.queryIUser({ name: search }, session.guildId)
  if (users.length === 0) return undefined // 没有对应名字的 user
  let substitute: { userId: string, username: string } | undefined
  if (users.length === 1) {
    substitute = { userId: users[0].id, username: users[0].name }
  } else {
    // 是否有唯一匹配. 注：用户昵称可能同名？
    const exactUsers = users.filter(u => u.name.toLowerCase() === search)
    if (exactUsers.length === 1) {
      substitute = { userId: exactUsers[0].id, username: exactUsers[0].name }
    }
  }
  return substitute
}

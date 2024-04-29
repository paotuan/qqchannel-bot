import type { ICommand, ICustomReplyConfig, ICustomReplyConfigItem } from '@paotuan/config'
import Mustache from 'mustache'
import { CardProvider } from '../../card/card-provider'
import { parseTemplate } from '../../dice'
import { at } from '../../dice/utils'

// 处理自定义回复
// 返回 [是否命中，处理结果]
export async function handleCustomReply(processors: ICustomReplyConfig[], { command, context }: ICommand): Promise<[boolean, string | undefined]> {
  // 从上到下匹配
  for (const processor of processors) {
    const matchGroups = isMatch(processor, command)
    if (!matchGroups) continue
    const reply = await parseMessage(processor, matchGroups, context)
    return [true, reply]
  }

  return [false, undefined]
}

async function parseMessage(processor: ICustomReplyConfig, matchGroups: Record<string, string>, context: ICommand['context']) {
  try {
    if (!processor.items && !processor.handler) throw new Error('没有处理自定义回复的方法')
    const handler = processor.handler ?? randomReplyItem(processor.items!).reply
    // 替换模板
    const username = context.username
    const userId = context.userId
    const userRole = context.userRole
    const channelUnionId = context.channelUnionId
    const replyFunc = typeof handler === 'function' ? handler : ((env: ICommand['context'], _matchGroup: Record<string, string>) => {
      return Mustache.render(handler, { ...env, ..._matchGroup }, undefined, { escape: value => value })
    })
    const card = CardProvider.INSTANCE.getCard(channelUnionId, userId)
    const env: ICommand<any>['context'] = {
      ...context,
      // 新增一些便于用户在 ui 上可以直接使用的参数
      nick: username,
      用户名: username,
      人物卡名: card?.name ?? username,
      at: at(userId),
      at用户: at(userId)
    }
    const template = await replyFunc(env, matchGroups)
    // 替换 inline rolls
    return parseTemplate(template, { userId, username, userRole, channelUnionId }, [], 'message_template')
  } catch (e: any) {
    console.error('[Config] 自定义回复处理出错', e?.message)
    return undefined
  }
}

// returns match groups
function isMatch(processor: ICustomReplyConfig, command: string): Record<string, string> | false {
  switch (processor.trigger) {
  case 'exact':
    return processor.command === command ? {} : false
  case 'startWith':
    return command.startsWith(processor.command) ? {} : false
  case 'include':
    return command.includes(processor.command) ? {} : false
  case 'regex': {
    const regex = new RegExp(processor.command) // 暂时没有缓存
    const match = command.match(regex)
    return match ? match.groups || {} : false
  }
  }
}

function randomReplyItem(items: ICustomReplyConfigItem[]) {
  if (items.length === 1) return items[0] // 大多数情况只有一条，直接返回
  // 根据权重计算. 权重目前只支持整数
  const totalWeight = items.map(item => item.weight).reduce((a, b) => a + b, 0)
  let randomWeight = Math.random() * totalWeight
  for (const item of items) {
    randomWeight -= item.weight
    if (randomWeight < 0) {
      return item
    }
  }
  // 理论不可能，除非权重填 0 了
  return items[items.length - 1]
}

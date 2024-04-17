import type { CustomTextKeys, ICustomTextHandler, ICustomTextItem } from '@paotuan/config'
import Mustache from 'mustache'

type CustomTextMap = Partial<Record<CustomTextKeys, ICustomTextItem[] | ICustomTextHandler>>
export function renderCustomText(customTextMap: CustomTextMap, key: CustomTextKeys, args: Record<string, any>, context: any) {
  const processor = customTextMap[key]
  if (!processor) {
    console.error(`[Config] 找不到 ${key} 的自定义文案`) // 理论上不可能，因为外部做了兜底
    return ''
  }
  if (typeof processor === 'function') {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore hidden api
      return processor(args, context)
    } catch (e: any) {
      console.error(`[Config] 自定义文案 ${key} 处理出错`, e?.message)
      return ''
    }
  } else {
    const replyItem = randomReplyItem(processor)
    let result = Mustache.render(replyItem.text, args, undefined, { escape: value => value })
    // 是否有提前结束
    const endIndex = result.indexOf('$end$')
    if (endIndex >= 0) {
      result = result.substring(0, endIndex)
    }
    return result
  }
}

function randomReplyItem(items: ICustomTextItem[]) {
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

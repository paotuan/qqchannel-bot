import type { IHookFunction } from '../../../../interface/config'

export function handleHooks<T>(processors: IHookFunction<(arg: T) => boolean>[], arg: T) {
  let depth = 0
  // 无限循环解析。如果有多个规则，可以让这些规则之间的顺序无关
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 死循环检测
    if (depth > 99) {
      console.warn('hook 嵌套过深，可能出现死循环！')
      break
    }
    depth++
    // 本次是否处理过
    let anyHandled = false
    // 从上到下处理
    for (const processor of processors) {
      const handled = processor.handler(arg)
      anyHandled ||= handled
    }
    // 判断是否处理完了
    if (!anyHandled) {
      break
    }
  }
}

export async function handleHooksAsync<T>(processors: IHookFunction<(arg: T) => boolean | Promise<boolean>>[], arg: T) {
  let depth = 0
  // 无限循环解析。如果有多个规则，可以让这些规则之间的顺序无关
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 死循环检测
    if (depth > 99) {
      console.warn('hook 嵌套过深，可能出现死循环！')
      break
    }
    depth++
    // 本次是否处理过
    let anyHandled = false
    // 从上到下处理
    for (const processor of processors) {
      const handled = await processor.handler(arg)
      anyHandled ||= handled
    }
    // 判断是否处理完了
    if (!anyHandled) {
      break
    }
  }
}

export function handleVoidHooks<T>(processors: IHookFunction<(arg: T) => void>[], arg: T) {
  for (const processor of processors) {
    processor.handler(arg)
  }
}

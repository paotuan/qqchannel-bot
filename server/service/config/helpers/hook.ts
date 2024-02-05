import type { IHookFunction, OnReceiveCommandCallback, ParseUserCommandResult } from '../../../../interface/config'

export async function handleOnReceiveCommand(processors: IHookFunction<OnReceiveCommandCallback>[], result: ParseUserCommandResult) {
  let depth = 0
  // 无限循环解析。如果有多个规则，可以让这些规则之间的顺序无关
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // 死循环检测
    if (depth > 99) {
      console.warn('hook:OnReceiveCommand 嵌套过深，可能出现死循环！')
      break
    }
    depth++
    // 本次是否处理过
    let anyHandled = false
    // 从上到下处理
    for (const processor of processors) {
      const handled = await processor.handler(result)
      anyHandled ||= handled
    }
    // 判断是否处理完了
    if (!anyHandled) {
      break
    }
  }
}

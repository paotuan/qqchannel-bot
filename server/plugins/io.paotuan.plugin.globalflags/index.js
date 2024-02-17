/* eslint-env node */

const regexCache = {}
const getRegex = pattern => {
  if (regexCache[pattern]) {
    return regexCache[pattern]
  }
  if (pattern.startsWith('/') && pattern.endsWith('/')) {
    // 1. /xxxx/ 格式的认为直接就是正则，需包含 command + count 捕获组
    // e.g. /^(\((?<count>\d+)\))?(?<command>.+?)(\((?<count2>\d+)\))?$/
    return regexCache[pattern] = new RegExp(pattern)
  } else {
    // 2. 普通格式的，拼装正则
    return regexCache[pattern] = new RegExp(`^(?<command>.+?)${pattern}(?<count>\\d+)$`)
  }
}

const handled = Symbol()

module.exports = ({ dispatchUserCommand, _ }) => {
  return {
    id: 'io.paotuan.plugin.globalflags',
    name: '全局指令选项',
    description: '在任意指令结尾加上 -x2 可进行连续掷骰',
    version: 1,
    hook: {
      onReceiveCommand: [
        {
          id: 'x',
          name: '全局连续掷骰',
          description: '在任意指令结尾加上 -x2 可进行连续掷骰',
          handler: result => {
            // 只处理一次
            if (result[handled]) {
              return false
            }
            result[handled] = true
            const pattern = '\\-x'
            const regex = getRegex(pattern)
            const matchResult = result.command.match(regex)
            if (matchResult && matchResult.groups) {
              let newCommand = undefined
              let count = undefined
              Object.keys(matchResult.groups).forEach(key => {
                // 所有 command* 代表新的 command
                // 所有 count* 代表新的 count
                if (key.startsWith('command')) {
                  newCommand = (matchResult.groups[key] || '').trim()
                } else if (key.startsWith('count')) {
                  count = parseInt(matchResult.groups[key] || '1')
                }
              })
              if (newCommand && count) {
                console.log('[全局连续掷骰]指令:', newCommand, '次数:', count)
                // 修改本次指令
                result.command = newCommand
                // 派发余下的次数
                const newResultToDispatch = _.cloneDeep(result)
                setTimeout( async () => {
                  for (let i = 0; i < count - 1; i++) {
                    // 防止触发频控，每发 5 条停止一下
                    if (i > 0 && i % 5 === 0) {
                      await new Promise(resolve => setTimeout(resolve, 1000))
                    }
                    dispatchUserCommand(_.cloneDeep(newResultToDispatch))
                  }
                }, 10)
                return true
              }
            }
            return false
          }
        }
      ]
    }
  }
}

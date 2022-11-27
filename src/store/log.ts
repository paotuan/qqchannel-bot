import { defineStore } from 'pinia'
import type { ILog } from '../../interface/common'
import { useUserStore } from './user'
import { gtagEvent } from '../utils'
import { useBotStore } from './bot'

export const useLogStore = defineStore('log', {
  state: () => ({
    logs: [] as ILog[],
    filterDiceCommand: Boolean(localStorage.getItem('config-filterDiceCommand')) // 是否无视指令消息
  }),
  actions: {
    addLogs(logs: ILog[]) {
      if (this.filterDiceCommand) {
        this.logs.push(...logs.filter(log => !(log.content.startsWith('.') || log.content.startsWith('。'))))
      } else {
        this.logs.push(...logs)
      }
      gtagLogs(logs)
    },
    removeLog(log: ILog) {
      const index = this.logs.indexOf(log)
      if (index >= 0) {
        this.logs.splice(index, 1)
      }
    },
    clear() {
      this.logs.length = 0
    },
    export(type: number) {
      gtagEvent('log/export', { log_type: ['', 'text', 'html', 'json'][type] })
      switch (type) {
      case 1:
        exportText(this.logs)
        break
      case 2:
        exportHTML(this.logs)
        break
      case 3:
        exportJson(this.logs)
        break
      }
    },
    toggleFilterDiceCommand() {
      this.filterDiceCommand = !this.filterDiceCommand
      localStorage.setItem('config-filterDiceCommand', String(this.filterDiceCommand))
    }
  }
})

// http://linkbroker.hu/stuff/kolorwheel.js/
const PATTLE = [
  ['#9999ff77', '#4d4dff'],
  ['#adfce277', '#58fcc5'],
  ['#e7fac077', '#c7fa63'],
  ['#fad1d177', '#f76e6e'],
  ['#a0cafe77', '#509efe'],
  ['#b3fbc377', '#5cfb7f'],
  ['#faf4c677', '#f9e967'],
  ['#a6f3fd77', '#54eafd'],
  ['#c8fbb977', '#82fa5f'],
  ['#fae0cb77', '#f8a96a']
]

const CSS_TEMPLATE = `
.chat-item { padding: 4px; }
.chat-item-name { font-weight: bold; }
.chat-item-time { margin-left: 0.5em; }
${PATTLE.map((colors, i) => `.chat-user-${i} { background: ${colors[0]}; border-left: 4px solid ${colors[1]}; }`).join('\n')}
`

// 导出 HTML
function exportHTML(logs: ILog[]) {
  const userStore = useUserStore()
  const userIds: string[] = []
  let lastUser = ''   // 上一个说话人，用于合并会话
  let listHtml = ''   // 最终结果
  logs.forEach(log => {
    const user = userStore.nickOf(log.userId) || log.username || log.userId
    if (user !== lastUser) {
      // 上一段结尾
      if (listHtml !== '') listHtml += '</div>'
      // 用户顺序
      let userIndex = userIds.indexOf(log.userId)
      if (userIndex < 0) {
        userIndex = userIds.length
        userIds.push(log.userId)
      }
      listHtml += `<div class='chat-item chat-user-${userIndex}'>`
        + `<div class='meta'><span class='chat-item-name'>${user}</span>`
        + `<span class='chat-item-time'>${formatTime(log.timestamp)}</span>`
        + `</div><div class='content'>${log.content}</div>`
    } else {
      listHtml += `<div class='content'>${log.content}</div>`
    }
    lastUser = user
  })
  if (listHtml !== '') listHtml += '</div>'
  // add css
  listHtml += `<style>${CSS_TEMPLATE}</style>`
  download('html', listHtml)
}

// 导出字符串
function exportText(logs: ILog[]) {
  const userStore = useUserStore()
  let lastUser = '' // 上一个说话人，用于合并会话
  let result = ''   // 最终结果
  logs.forEach(log => {
    const user = userStore.nickOf(log.userId) || log.username || log.userId
    if (user !== lastUser) {
      result += `${user} ${formatTime(log.timestamp)}\n`
    }
    result += log.content + '\n'
    lastUser = user
  })
  download('text', result)
}

// 导出 json
function exportJson(logs: ILog[]) {
  const userStore = useUserStore()
  const logWithNick = logs.map(log => ({ ...log, username: userStore.nickOf(log.userId) || log.username || log.userId }))
  download('json', JSON.stringify(logWithNick))
}

// 将字符串作为文件下载
// type: text/html/json
function download(type: 'text' | 'html' | 'json', text: string) {
  const element = document.createElement('a')
  element.setAttribute('href', `data:${type}/plain;charset=utf-8,` + encodeURIComponent(text))
  element.setAttribute('download', `log.${type === 'text' ? 'txt' : type}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

function formatTime(str: string) {
  return new Date(str).toLocaleString().replaceAll('/', '-')
}

function gtagLogs(logs: ILog[]) {
  const botStore = useBotStore()
  logs.forEach(log => {
    gtagEvent('log/message')
    if (log.userId === botStore.botId) {
      gtagEvent('log/botMessage')
    }
  })
}

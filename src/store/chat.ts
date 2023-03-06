import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { nanoid } from 'nanoid/non-secure'
import { useBotStore } from './bot'

interface IMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  isError?: boolean
}

type IMessageForRequest = Omit<IMessage, 'id'>

export const useChatStore = defineStore('chat', () => {
  const systemPrompt = ref('')
  const history = reactive<IMessage[]>([])
  const chatLoading = ref(false)
  const chatError = ref('') // todo 干掉
  const apiKey = ref('')

  const _getBodyAndRecord = (content: string) => {
    const body = history.map(item => ({ role: item.role, content: item.content })) // todo 过滤掉当次失败的请求
    const userMessage = { role: 'user' as const, content: content.trim() }
    body.push(userMessage)
    if (systemPrompt.value.trim()) {
      body.unshift({ role: 'system', content: systemPrompt.value.trim() })
    }
    // record history
    history.push({ ...userMessage, id: nanoid() })
    return body
  }

  const _requestInner = async (body: IMessageForRequest[]) => {
    // todo report
    const bot = useBotStore()
    const response = await fetch('https://chatapi.paotuan.io/channel-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: body, auth: auth(`${bot.appid}.${bot.token}`) })
    })
    if (response.status !== 200) {
      const body = await response.text()
      chatError.value = `Failed to send message. HTTP ${response.status} - ${body}`
    } else {
      const res = await response.json()
      const content = res.choices[0].message.content.trim()
      history.push({ role: 'assistant', content, id: nanoid() })
    }
  }

  const _requestOfficial = async (body: IMessageForRequest[]) => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.value.trim()}` },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: body })
    })
    if (response.status !== 200) {
      const body = await response.text()
      chatError.value = `Failed to send message. HTTP ${response.status} - ${body}`
    } else {
      const res = await response.json()
      const content = res.choices[0].message.content.trim()
      history.push({ role: 'assistant', content, id: nanoid() })
    }
  }

  const request = async (content: string) => {
    const body = _getBodyAndRecord(content)
    try {
      chatLoading.value = true
      chatError.value = ''
      await (apiKey.value.trim() ? _requestOfficial : _requestInner)(body)
    } catch (e) {
      console.log(e)
      chatError.value = '发生了错误'
    } finally {
      chatLoading.value = false
    }
  }

  const clearHistory = () => history.length = 0

  // 清除单轮对话
  const clearSingle = (id: string) => {
    const index2remove = history.findIndex(item => item.id === id)
    if (index2remove >= 0) {
      history.splice(index2remove - 1, 2) // 发送方一起删
    }
  }

  return { systemPrompt, history, chatLoading, chatError, request, clearHistory, clearSingle }
})

function auth(data: string) {
  const key = 'paotuan.io'
  let message = ''
  for (let i = 0; i < data.length; i++) {
    message += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(message)
}

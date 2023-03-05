import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { nanoid } from 'nanoid/non-secure'

interface IMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
}

type IMessageForRequest = Omit<IMessage, 'id'>

export const useChatStore = defineStore('chat', () => {
  const systemPrompt = ref('')
  const history = reactive<IMessage[]>([])
  const chatLoading = ref(false)
  const chatError = ref('')
  const apiKey = ref('')

  const _getBodyAndRecord = (content: string) => {
    const body = history.map(item => ({ role: item.role, content: item.content }))
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
    const response = await fetch('https://chatapi.paotuan.io/channel-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: body })
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

  return { systemPrompt, history, chatLoading, chatError, request, clearHistory }
})

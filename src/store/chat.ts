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
  const apiKey = ref('')

  const _getBodyAndRecord = (content: string) => {
    // 如果有失败的消息，则过滤掉
    if (history.at(-1)?.isError) {
      clearSingle(history.at(-1)!.id)
    }
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

  const _requestInner = (body: IMessageForRequest[]) => {
    // todo report
    const bot = useBotStore()
    return fetch('https://chatapi.paotuan.io/channel-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: body, auth: auth(`${bot.appid}.${bot.token}`) })
    })
  }

  const _requestOfficial = (body: IMessageForRequest[]) => {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.value.trim()}` },
      body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: body })
    })
  }

  const request = async (content: string) => {
    if (chatLoading.value) return // loading 中不允许请求
    const body = _getBodyAndRecord(content)
    try {
      chatLoading.value = true
      const response = await (apiKey.value.trim() ? _requestOfficial : _requestInner)(body)
      if (response.status !== 200) {
        const body = await response.text()
        history.push({ role: 'assistant', content: `Failed to send message. HTTP ${response.status} - ${body}`, id: nanoid(), isError: true })
      } else {
        const res = await response.json()
        const content = res.choices[0].message.content.trim()
        history.push({ role: 'assistant', content, id: nanoid() })
      }
      // await new Promise(resolve => {
      //   setTimeout(() => {
      //     history.push({ role: 'assistant', content: '我是一名人工智能语言模型，被设计用于提供基于自然语言的智能交互，以帮助人类更高效地处理信息和解决问题。我能够理解和解释人类的语言，并给出与之相关的答案和建议。我没有具体的身份，也没有情感和创造力，但我会尽力帮助提问者解决问题，并通过不断的学习和进化来提高自己的智能和能力。', id: nanoid() })
      //     resolve('')
      //   }, 2000)
      // })
    } catch (e) {
      console.log(e)
      history.push({ role: 'assistant', content: '发生了错误', id: nanoid(), isError: true })
    } finally {
      chatLoading.value = false
    }
  }

  const clearHistory = () => {
    if (chatLoading.value) return // loading 中先不允许操作吧，以防止潜在的 bug
    history.length = 0
  }

  // 清除单轮对话
  const clearSingle = (id: string) => {
    const index2remove = history.findIndex(item => item.id === id)
    if (index2remove > 0) {
      history.splice(index2remove - 1, 2) // 发送方一起删
    } else if (index2remove === 0) {
      history.splice(0, 1)
    }
  }

  return { systemPrompt, history, chatLoading, request, clearHistory, clearSingle }
})

function auth(data: string) {
  const key = 'paotuan.io'
  let message = ''
  for (let i = 0; i < data.length; i++) {
    message += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(message)
}

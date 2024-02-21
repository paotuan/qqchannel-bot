import { defineStore } from 'pinia'
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { nanoid } from 'nanoid/non-secure'
import Api2d from '@paotuan/api2d'

interface IMessage {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  isError?: boolean
}

// ai 设置
interface IChatSetting {
  useOfficialApi: boolean
  apiKey: string
  apiProxy: string
  model: string
}

const OfficialEndpoint = 'https://api.openai.com'
const InnerEndpoint = 'https://apic.ohmygpt.com'
const InnerToken = 'sk-jehssdZXABbfE909E0DeT3BLBkFJ83Bc3b41eEa14fe4a7a3'

export const useChatStore = defineStore('chat', () => {
  const systemPrompt = ref('')
  const history = reactive<IMessage[]>([])
  const chatLoading = ref(false)
  const settings = loadChatSettings()
  const useOfficialApi = ref(settings?.useOfficialApi ?? false)
  const apiKey = ref(settings?.apiKey ?? '')
  const apiProxy = ref(settings?.apiProxy ?? '')
  const model = ref(settings?.model ?? 'gpt-3.5-turbo')
  const apiClient = shallowRef(new Api2d())

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

  const request = async (content: string) => {
    if (chatLoading.value) return // loading 中不允许请求
    const body = _getBodyAndRecord(content)
    // 开始请求
    chatLoading.value = true
    const replyMessage: IMessage = { role: 'assistant', content: 'AI 助手思考中…', id: nanoid() }
    history.push(replyMessage) // 先放一条假消息
    try {
      const api = apiClient.value
      const useOfficial = useOfficialApi.value
      api.setApiBaseUrl(useOfficial ? apiProxy.value.trim() || OfficialEndpoint : InnerEndpoint)
      api.setKey(useOfficial ? apiKey.value.trim() : InnerToken)
      await api.completion({
        model: useOfficial ? model.value : 'gpt-3.5-turbo',
        messages: body,
        stream: true,
        onMessage: str => {
          // 确保使用的是响应式的对象
          history.at(-1)!.content = str
        },
        onEnd: str => {
          // end
        }
      })
      // await new Promise(resolve => {
      //   setTimeout(() => {
      //     history.push({ role: 'assistant', content: '我是一名人工智能语言模型，被设计用于提供基于自然语言的智能交互，以帮助人类更高效地处理信息和解决问题。我能够理解和解释人类的语言，并给出与之相关的答案和建议。我没有具体的身份，也没有情感和创造力，但我会尽力帮助提问者解决问题，并通过不断的学习和进化来提高自己的智能和能力。', id: nanoid() })
      //     resolve('')
      //   }, 2000)
      // })
    } catch (e: any) {
      console.log(e)
      replyMessage.content = `Error: ${e?.message}`
      replyMessage.isError = true
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

  // 记忆设置
  const settingsAsJson = computed<IChatSetting>(() => ({
    useOfficialApi: useOfficialApi.value,
    apiKey: apiKey.value,
    apiProxy: apiProxy.value,
    model: model.value
  }))

  watch(settingsAsJson, obj => {
    localStorage.setItem('chat-settings', JSON.stringify(obj))
  })

  return { systemPrompt, history, chatLoading, useOfficialApi, apiKey, apiProxy, model, request, clearHistory, clearSingle }
})

function loadChatSettings(): IChatSetting | undefined {
  const settings = localStorage.getItem('chat-settings')
  if (!settings) return undefined
  try {
    return JSON.parse(settings) as IChatSetting
  } catch (e) {
    return undefined
  }
}

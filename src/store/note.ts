import { defineStore } from 'pinia'
import type { INote, INoteDeleteReq, INoteFetchReq, INoteSendImageRawReq, INoteSendReq } from '../../interface/common'
import ws from '../api/ws'
import { gtagEvent, Toast } from '../utils'

export const useNoteStore = defineStore('note', {
  state: () => ({
    // 表单相关
    textContent: '',
    imageDialogVisible: false,
    imageUrl: '',
    imageFile: null as File | null,
    imageFileChooser: null as HTMLInputElement | null,
    // 表单相关 end
    ids: [] as string[],
    msgMap: {} as { [key: string]: INote },
    lastSyncTime: 0
  }),
  getters: {
    notes: state => state.ids.map(id => state.msgMap[id]).filter(note => !!note)
  },
  actions: {
    sendText() {
      if (!this.textContent) return
      ws.send<INoteSendReq>({ cmd: 'note/send', data: { msgType: 'text', content: this.textContent } })
      gtagEvent('note/send')
    },
    sendImage() {
      if (this.imageUrl) {
        const url = this.imageUrl.trim()
        if (!url.startsWith('https://')) {
          Toast.error('图片链接必须以 https:// 开头！')
          return
        }
        ws.send<INoteSendReq>({ cmd: 'note/send', data: { msgType: 'image', content: url } })
        gtagEvent('note/send')
      } else if (this.imageFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageUrl = e.target!.result as string // base64
          ws.send<INoteSendImageRawReq>({ cmd: 'note/sendImageRaw', data: { data: imageUrl } })
          gtagEvent('note/send')
        }
        reader.readAsDataURL(this.imageFile)
      }
    },
    clearText() {
      this.textContent = ''
    },
    clearImage() {
      this.imageDialogVisible = false
      this.imageUrl = ''
      this.imageFile = null
      if (this.imageFileChooser) this.imageFileChooser.value = ''
    },
    sync() {
      ws.send({ cmd: 'note/sync', data: '' })
      gtagEvent('note/sync')
    },
    fetchNotesIfNeed() {
      const needToFetchIds = this.ids.filter(id => !this.msgMap[id])
      if (needToFetchIds.length > 0) {
        ws.send<INoteFetchReq>({ cmd: 'note/fetch', data: { allNoteIds: needToFetchIds } })
      }
    },
    delete(note: INote) {
      const index = this.ids.indexOf(note.msgId)
      if (index >= 0) {
        this.ids.splice(index, 1)
        ws.send<INoteDeleteReq>({ cmd: 'note/delete', data: { id: note.msgId } })
        gtagEvent('note/delete')
      }
    }
  }
})

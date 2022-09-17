import { defineStore } from 'pinia'
import type { INote, INoteDeleteReq, INoteFetchReq, INoteSendReq } from '../../interface/common'
import ws from '../api/ws'

export const useNoteStore = defineStore('note', {
  state: () => ({
    textContent: '',
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
    },
    clearText() {
      this.textContent = ''
    },
    sync() {
      ws.send({ cmd: 'note/sync', data: '' })
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
      }
    }
  }
})
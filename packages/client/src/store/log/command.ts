import type { ILog } from '@paotuan/types'
import { uniqueId } from 'lodash'

export interface ILogCommand {
  type: 'Delete' | 'Drag'
  id: string
  log?: ILog
  apply(logs: ILog[]): void
  undo(logs: ILog[]): void
}

export class DeleteAction implements ILogCommand {
  type = 'Delete' as const
  id = uniqueId()
  log: ILog
  originIndex?: number

  constructor(log: ILog) {
    this.log = log
  }

  apply(logs: ILog[]) {
    const index = logs.indexOf(this.log)
    if (index >= 0) {
      this.originIndex = index
      logs.splice(index, 1)
    }
  }

  undo(logs: ILog[]) {
    if (typeof this.originIndex === 'undefined' || this.originIndex < 0) {
      console.warn('Cannot apply DeleteAction, index =', this.originIndex)
      return
    }
    logs.splice(this.originIndex, 0, this.log)
  }
}

export class DragAction implements ILogCommand {
  type = 'Drag' as const
  id = uniqueId()
  oldIndex: number
  newIndex: number
  log?: ILog

  constructor(oldIndex: number, newIndex: number) {
    this.oldIndex = oldIndex
    this.newIndex = newIndex
  }

  apply(logs: ILog[]) {
    const movingLog = logs.splice(this.oldIndex, 1)[0]
    this.log = movingLog
    logs.splice(this.newIndex, 0, movingLog)
  }

  undo(logs: ILog[]) {
    const movingLog = logs.splice(this.newIndex, 1)[0]
    logs.splice(this.oldIndex, 0, movingLog)
  }
}

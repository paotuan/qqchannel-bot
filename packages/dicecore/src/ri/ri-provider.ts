import { DefaultRiState, IRiItem, IRiState } from './state'

export class RiProvider implements IRiState {
  static readonly INSTANCE = new RiProvider()

  private _state?: IRiState

  private constructor() {
  }

  private get state() {
    if (!this._state) {
      this._state = new DefaultRiState()
    }
    return this._state
  }

  setState(state: IRiState) {
    this._state = state
  }

  clearRiList(channelUnionId: string) {
    this.state.clearRiList(channelUnionId)
  }

  getDescription(channelUnionId: string) {
    return this.state.getDescription(channelUnionId)
  }

  getRiList(channelUnionId: string) {
    return this.state.getRiList(channelUnionId)
  }

  removeRiList(channelUnionId: string, list: Partial<IRiItem>[]) {
    this.state.removeRiList(channelUnionId, list)
  }

  updateRiList(channelUnionId: string, list: Partial<IRiItem>[]) {
    this.state.updateRiList(channelUnionId, list)
  }

  getRiName(item: Partial<IRiItem>) {
    return this.state.getRiName(item)
  }
}

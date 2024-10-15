import {
  Context as SatoriContext,
  HTTP,
  Bot as SatoriApi,
  ForkScope as _ForkScope,
  GetEvents,
  Universal,
  Session,
  Element
} from '@satorijs/core'

export class Context extends SatoriContext {
  constructor(httpPort: number) {
    super()
    try {
      this.provide('http', undefined, true)
      this.plugin(HTTP, { baseURL: `http://localhost:${httpPort}` })
    } catch (e) {
      console.log(e)
    }
  }
}

export type ForkScope = _ForkScope<Context>
export type Events = GetEvents<Context>

export {
  SatoriApi,
  Universal,
  Session,
  Element
}

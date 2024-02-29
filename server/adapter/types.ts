export type Platform = 'qq' | 'kook'

export interface IBotConfig {
  platform: Platform
  appid: string
  [key: string]: any
}

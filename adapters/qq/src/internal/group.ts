import * as QQ from '../types'
import { GroupInternal } from '.'

declare module './internal' {
  interface GroupInternal {
    sendMessage(channel_id: string, data: QQ.Message.Request): Promise<{
      id: string
      timestamp: string
      audit_id?: string
      audit_tips?: string
    }>
    sendPrivateMessage(openid: string, data: QQ.Message.Request): Promise<{
      id: string
      timestamp: string
      audit_id?: string
      audit_tips?: string
    }>
    sendFilePrivate(openid: string, data: QQ.Message.File.Request): Promise<any>
    sendFileGuild(group_openid: string, data: QQ.Message.File.Request): Promise<any>
    acknowledgeInteraction(interaction_id: string, data: {
      code: number
    }): Promise<any>
    getGateway(): Promise<QQ.GetGatewayResponse>
    getGatewayBot(): Promise<QQ.GetGatewayBotResponse>
    deleteMessage(openid: string, message_id: string): Promise<any>
    deletePrivateMessage(userid: string, message_id: string): Promise<any>
  }
}

GroupInternal.define(false, {
  '/v2/groups/{channel.id}/messages': {
    POST: 'sendMessage',
  },
  '/v2/groups/{channel.id}/messages/{message.id}': {
    DELETE: 'deleteMessage',
  },
  '/v2/users/{user.id}/messages': {
    POST: 'sendPrivateMessage',
  },
  '/v2/users/{user.id}/messages/{message.id}': {
    DELETE: 'deletePrivateMessage',
  },
  '/v2/users/{user.id}/files': {
    POST: 'sendFilePrivate',
  },
  '/v2/groups/{channel.id}/files': {
    POST: 'sendFileGuild',
  },
  '/gateway': {
    GET: 'getGateway',
  },
  '/gateway/bot': {
    GET: 'getGatewayBot',
  },
})

// fxxk tencent
GroupInternal.define(false, {
  '/interactions/{interaction.id}': {
    PUT: 'acknowledgeInteraction',
  },
}, { responseType: 'text' })

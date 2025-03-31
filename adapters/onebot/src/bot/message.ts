import { Context, Dict, h, MessageEncoder, pick, Universal } from '@satorijs/core'
import { BaseBot } from './base'
import { CQCode } from './cqcode'
import { fileURLToPath } from 'node:url'

export interface Author extends Universal.User {
  time?: string | number
  messageId?: string
}

class State {
  author: Partial<Author> = {}
  children: CQCode[] = []

  constructor(public type: 'message' | 'forward' | 'reply') { }
}

export const PRIVATE_PFX = 'private:'

export class OneBotMessageEncoder<C extends Context = Context> extends MessageEncoder<C, BaseBot<C>> {
  stack: State[] = [new State('message')]
  children: CQCode[] = []

  override async prepare(): Promise<void> {
    super.prepare()
    const { event: { channel } } = this.session
    if (!channel.type) {
      channel.type = channel.id.startsWith(PRIVATE_PFX)
        ? Universal.Channel.Type.DIRECT
        : Universal.Channel.Type.TEXT
    }
    if (!this.session.isDirect) {
      this.session.guildId ??= this.channelId
    }
  }

  async forward() {
    if (!this.stack[0].children.length) return
    const session = this.bot.session()
    session.content = ''
    session.messageId = this.session.event.channel.type === Universal.Channel.Type.DIRECT
      ? '' + await this.bot.internal.sendPrivateForwardMsg(this.channelId.slice(PRIVATE_PFX.length), this.stack[0].children)
      : '' + await this.bot.internal.sendGroupForwardMsg(this.channelId, this.stack[0].children)
    session.userId = this.bot.selfId
    session.channelId = this.session.channelId
    session.guildId = this.session.guildId
    session.isDirect = this.session.isDirect
    session.app.emit(session, 'send', session)
    this.results.push(session.event.message)
  }

  async flush() {
    // trim start
    while (true) {
      const first = this.children[0]
      if (first?.type !== 'text') break
      first.data.text = first.data.text.trimStart()
      if (first.data.text) break
      this.children.shift()
    }

    // trim end
    while (true) {
      const last = this.children[this.children.length - 1]
      if (last?.type !== 'text') break
      last.data.text = last.data.text.trimEnd()
      if (last.data.text) break
      this.children.pop()
    }

    // flush
    const { type, author } = this.stack[0]
    if (!this.children.length && !author.messageId) return
    if (type === 'forward') {
      if (author.messageId) {
        this.stack[1].children.push({
          type: 'node',
          data: {
            id: author.messageId,
          },
        })
      } else {
        this.stack[1].children.push({
          type: 'node',
          data: {
            name: author.name || this.bot.user.name,
            uin: author.id || this.bot.userId,
            content: this.children as any,
            time: `${Math.floor((+author.time || Date.now()) / 1000)}`,
          },
        })
      }

      this.children = []
      return
    }

    const session = this.bot.session()
    session.content = ''
    session.messageId = this.bot.parent
      ? '' + await this.bot.internal.sendGuildChannelMsg(this.session.guildId, this.channelId, this.children)
      : this.session.event.channel.type === Universal.Channel.Type.DIRECT
        ? '' + await this.bot.internal.sendPrivateMsg(this.channelId.slice(PRIVATE_PFX.length), this.children)
        : '' + await this.bot.internal.sendGroupMsg(this.channelId, this.children)
    session.userId = this.bot.selfId
    session.channelId = this.session.channelId
    session.guildId = this.session.guildId
    session.isDirect = this.session.isDirect
    session.app.emit(session, 'send', session)
    this.results.push(session.event.message)
    this.children = []
  }

  private async sendFile(attrs: Dict) {
    const src: string = attrs.src || attrs.url
    const name = attrs.title || (await this.bot.ctx.http.file(src)).filename
    // 本地文件路径
    const file = src.startsWith('file:') ? fileURLToPath(src) : await this.bot.internal.downloadFile(src)
    if (this.session.event.channel.type === Universal.Channel.Type.DIRECT) {
      await this.bot.internal.uploadPrivateFile(
        this.channelId.slice(PRIVATE_PFX.length),
        file,
        name,
      )
    } else {
      await this.bot.internal.uploadGroupFile(
        this.channelId,
        file,
        name,
      )
    }
    const session = this.bot.session()
    // 相关 API 没有返回 message_id
    session.messageId = ''
    session.content = ''
    session.userId = this.bot.selfId
    session.channelId = this.session.channelId
    session.guildId = this.session.guildId
    session.isDirect = this.session.isDirect
    session.app.emit(session, 'send', session)
    this.results.push(session.event.message)
  }

  private text(text: string) {
    this.children.push({ type: 'text', data: { text } })
  }

  async visit(element: h) {
    let { type, attrs, children } = element
    if (type === 'text') {
      this.text(attrs.content)
    } else if (type === 'br') {
      this.text('\n')
    } else if (type === 'p') {
      const prev = this.children[this.children.length - 1]
      if (prev?.type === 'text') {
        if (!prev.data.text.endsWith('\n')) {
          prev.data.text += '\n'
        }
      } else {
        this.text('\n')
      }
      await this.render(children)
      this.text('\n')
    } else if (type === 'at') {
      if (attrs.type === 'all') {
        this.children.push({ type: 'at', data: { qq: 'all' } })
      } else {
        this.children.push({ type: 'at', data: { qq: attrs.id, name: attrs.name } })
      }
    } else if (type === 'sharp') {
      if (attrs.id) this.text(attrs.id)
    } else if (type === 'face') {
      if (attrs.platform && attrs.platform !== this.bot.platform) {
        await this.render(children)
      } else {
        this.children.push({ type: 'face', data: { id: attrs.id } })
      }
    } else if (type === 'a') {
      await this.render(children)
      // https://github.com/koishijs/koishi-plugin-adapter-onebot/issues/23
      if (attrs.href) this.text(`（${attrs.href}）`)
    } else if (['video', 'audio', 'image', 'img'].includes(type)) {
      if (type === 'video' || type === 'audio') await this.flush()
      if (type === 'audio') type = 'record'
      if (type === 'img') type = 'image'
      attrs = { ...attrs }
      attrs.file = attrs.src || attrs.url
      delete attrs.src
      delete attrs.url
      if (attrs.cache) {
        attrs.cache = 1
      } else {
        attrs.cache = 0
      }
      // https://github.com/koishijs/koishi-plugin-adapter-onebot/issues/30
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
      const cap = /^data:([\w/.+-]+);base64,/.exec(attrs.file)
      if (cap) attrs.file = 'base64://' + attrs.file.slice(cap[0].length)
      this.children.push({ type, data: attrs })
    } else if (type === 'file') {
      await this.flush()
      await this.sendFile(attrs)
    } else if (type === 'onebot:music') {
      await this.flush()
      this.children.push({ type: 'music', data: attrs })
    } else if (type === 'onebot:tts') {
      await this.flush()
      this.children.push({ type: 'tts', data: attrs })
    } else if (type === 'onebot:poke') {
      await this.flush()
      this.children.push({ type: 'poke', data: attrs })
    } else if (type === 'onebot:gift') {
      await this.flush()
      this.children.push({ type: 'gift', data: attrs })
    } else if (type === 'onebot:share') {
      await this.flush()
      this.children.push({ type: 'share', data: attrs })
    } else if (type === 'onebot:json') {
      await this.flush()
      this.children.push({ type: 'json', data: attrs })
    } else if (type === 'onebot:xml') {
      await this.flush()
      this.children.push({ type: 'xml', data: attrs })
    } else if (type === 'onebot:cardimage') {
      await this.flush()
      this.children.push({ type: 'cardimage', data: attrs })
    } else if (type === 'author') {
      Object.assign(this.stack[0].author, attrs)
    } else if (type === 'figure' && !this.bot.parent) {
      await this.flush()
      this.stack.unshift(new State('forward'))
      await this.render(children)
      await this.flush()
      this.stack.shift()
      await this.forward()
    } else if (type === 'figure') {
      await this.render(children)
      await this.flush()
    } else if (type === 'quote') {
      await this.flush()
      this.children.push({ type: 'reply', data: attrs })
    } else if (type === 'message') {
      await this.flush()
      // qqguild does not support forward messages
      if ('forward' in attrs && !this.bot.parent) {
        this.stack.unshift(new State('forward'))
        await this.render(children)
        await this.flush()
        this.stack.shift()
        await this.forward()
      } else if ('id' in attrs) {
        this.stack[0].author.messageId = attrs.id.toString()
      } else {
        Object.assign(this.stack[0].author, pick(attrs, ['userId', 'username', 'nickname', 'time']))
        await this.render(children)
        await this.flush()
      }
    } else {
      await this.render(children)
    }
  }
}

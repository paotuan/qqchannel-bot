const Y = require('yjs')
const syncProtocol = require('y-protocols/sync')
const awarenessProtocol = require('y-protocols/awareness')

const encoding = require('lib0/encoding')
const decoding = require('lib0/decoding')
const map = require('lib0/map')

const debounce = require('lodash.debounce')

const callbackHandler = require('./callback.cjs').callbackHandler
const isCallbackSet = require('./callback.cjs').isCallbackSet

const CALLBACK_DEBOUNCE_WAIT = parseInt(process.env.CALLBACK_DEBOUNCE_WAIT || '2000')
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000')

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2 // eslint-disable-line
const wsReadyStateClosed = 3 // eslint-disable-line

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0'
/**
 * @type {{bindState: function(string,WSSharedDoc,function):void, writeState:function(string,WSSharedDoc):Promise<any>, provider: any}|null}
 */
let persistence = null

/**
 * @param {string} persistenceDir
 */
exports.setupPersistence = (persistenceDir) => {
  if (typeof persistenceDir === 'string') {
    console.info('Persisting documents to "' + persistenceDir + '"')
    // @ts-ignore
    const LeveldbPersistence = require('y-leveldb').LeveldbPersistence
    const ldb = new LeveldbPersistence(persistenceDir)
    persistence = {
      provider: ldb,
      bindState: async (docName, ydoc, onload) => {
        const persistedYdoc = await ldb.getYDoc(docName)
        const newUpdates = Y.encodeStateAsUpdate(ydoc)
        ldb.storeUpdate(docName, newUpdates)
        Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
        ydoc.on('update', update => {
          ldb.storeUpdate(docName, update)
        })
        console.info('Load from db:', docName)
        onload?.()
      },
      writeState: async (_docName, _ydoc) => {}
    }
  }
}

/**
 * @param {{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>,provider:any}|null} persistence_
 */
exports.setPersistence = persistence_ => {
  persistence = persistence_
}

/**
 * @return {null|{bindState: function(string,WSSharedDoc):void,
 * writeState:function(string,WSSharedDoc):Promise<any>}|null} used persistence layer
 */
exports.getPersistence = () => persistence

/**
 * @type {Map<string,WSSharedDoc>}
 */
const docs = new Map()
// exporting docs so that others can use it
exports.docs = docs

const messageSync = 0
const messageAwareness = 1
// const messageAuth = 2

/**
 * @param {Uint8Array} update
 * @param {any} _origin
 * @param {WSSharedDoc} doc
 * @param {any} _tr
 */
const updateHandler = (update, _origin, doc, _tr) => {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeUpdate(encoder, update)
  const message = encoding.toUint8Array(encoder)
  doc.conns.forEach((_, conn) => send(doc, conn, message))
}

/**
 * @type {(ydoc: Y.Doc) => Promise<void>}
 */
let contentInitializor = _ydoc => Promise.resolve()

/**
 * This function is called once every time a Yjs document is created. You can
 * use it to pull data from an external source or initialize content.
 *
 * @param {(ydoc: Y.Doc) => Promise<void>} f
 */
exports.setContentInitializor = (f) => {
  contentInitializor = f
}

class WSSharedDoc extends Y.Doc {
  /**
   * @param {string} name
   */
  constructor (name) {
    super({ gc: gcEnabled })
    this.name = name
    /**
     * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
     * @type {Map<Object, Set<number>>}
     */
    this.conns = new Map()
    /**
     * @type {awarenessProtocol.Awareness}
     */
    this.awareness = new awarenessProtocol.Awareness(this)
    this.awareness.setLocalState(null)
    /**
     * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
     * @param {Object | null} conn Origin is the connection that made the change
     */
    const awarenessChangeHandler = ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed)
      if (conn !== null) {
        const connControlledIDs = /** @type {Set<number>} */ (this.conns.get(conn))
        if (connControlledIDs !== undefined) {
          added.forEach(clientID => { connControlledIDs.add(clientID) })
          removed.forEach(clientID => { connControlledIDs.delete(clientID) })
        }
      }
      // broadcast awareness update
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
      const buff = encoding.toUint8Array(encoder)
      this.conns.forEach((_, c) => {
        send(this, c, buff)
      })
    }
    this.awareness.on('update', awarenessChangeHandler)
    this.on('update', /** @type {any} */ (updateHandler))
    if (isCallbackSet) {
      this.on('update', /** @type {any} */ (debounce(
        callbackHandler,
        CALLBACK_DEBOUNCE_WAIT,
        { maxWait: CALLBACK_DEBOUNCE_MAXWAIT }
      )))
    }
    this.whenInitialized = contentInitializor(this)
  }
}

exports.WSSharedDoc = WSSharedDoc

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @param {string} docname - the name of the Y.Doc to find or create
 * @param {function} onload - called when load from db
 * @param {boolean} gc - whether to allow gc on the doc (applies only when created)
 * @return {WSSharedDoc}
 */
const getYDoc = (docname, onload = undefined, gc = true) => map.setIfUndefined(docs, docname, () => {
  const doc = new WSSharedDoc(docname)
  doc.gc = gc
  if (persistence !== null) {
    persistence.bindState(docname, doc, onload)
  }
  docs.set(docname, doc)
  return doc
})

exports.getYDoc = getYDoc

/**
 * @param {any} conn
 * @param {WSSharedDoc} doc
 * @param {Uint8Array} message
 */
const messageListener = (conn, doc, message) => {
  try {
    const encoder = encoding.createEncoder()
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)
    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn)

        // If the `encoder` only contains the type of reply message and no
        // message, there is no need to send the message. When `encoder` only
        // contains the type of reply, its length is 1.
        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder))
        }
        break
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), conn)
        break
      }
    }
  } catch (err) {
    console.error(err)
    // @ts-ignore
    doc.emit('error', [err])
  }
}

/**
 * @param {WSSharedDoc} doc
 * @param {any} conn
 */
const closeConn = (doc, conn) => {
  if (doc.conns.has(conn)) {
    /**
     * @type {Set<number>}
     */
      // @ts-ignore
    const controlledIds = doc.conns.get(conn)
    doc.conns.delete(conn)
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(controlledIds), null)
    // client 关闭时不要销毁 server 的状态
    // 我们的 bizServer 本质上也是一个特殊的 client
    // if (doc.conns.size === 0 && persistence !== null) {
    //   // if persisted, we store state and destroy ydocument
    //   persistence.writeState(doc.name, doc).then(() => {
    //     doc.destroy()
    //   })
    //   docs.delete(doc.name)
    // }
  }
  conn.close()
}

/**
 * @param {WSSharedDoc} doc
 * @param {import('ws').WebSocket} conn
 * @param {Uint8Array} m
 */
const send = (doc, conn, m) => {
  if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
    closeConn(doc, conn)
  }
  try {
    conn.send(m, {}, err => { err != null && closeConn(doc, conn) })
  } catch (e) {
    closeConn(doc, conn)
  }
}

const pingTimeout = 30000

/**
 * @param {import('ws').WebSocket} conn
 * @param {import('http').IncomingMessage} req
 * @param {any} opts
 */
exports.setupWSConnection = (conn, req, { docName = (req.url || '').slice(1).split('?')[0], gc = true } = {}) => {
  conn.binaryType = 'arraybuffer'
  // get doc, initialize if it does not exist yet
  // 根据目前的设计，确保这里的 getYDoc 都是已经初始化好的
  const doc = getYDoc(docName)
  doc.conns.set(conn, new Set())
  // listen and reply to events
  conn.on('message', /** @param {ArrayBuffer} message */ message => messageListener(conn, doc, new Uint8Array(message)))

  // Check if connection is still alive
  let pongReceived = true
  const pingInterval = setInterval(() => {
    if (!pongReceived) {

      if (doc.conns.has(conn)) {
        closeConn(doc, conn)
      }
      clearInterval(pingInterval)
    } else if (doc.conns.has(conn)) {
      pongReceived = false
      try {
        conn.ping()
      } catch (e) {
        closeConn(doc, conn)
        clearInterval(pingInterval)
      }
    }
  }, pingTimeout)
  conn.on('close', () => {
    closeConn(doc, conn)
    clearInterval(pingInterval)
  })
  conn.on('pong', () => {
    pongReceived = true
  })
  // put the following in a variables in a block so the interval handlers don't keep in in
  // scope
  {
    // send sync step 1
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeSyncStep1(encoder, doc)
    send(doc, conn, encoding.toUint8Array(encoder))
    const awarenessStates = doc.awareness.getStates()
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageAwareness)
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys())))
      send(doc, conn, encoding.toUint8Array(encoder))
    }
  }
}

const WebSocket = require('ws')
const utils = require('./utils.cjs')
const setupPersistence = utils.setupPersistence
const setupWSConnection = utils.setupWSConnection
const getYDoc = utils.getYDoc

exports.createWss = (options = {}) => {
  setupPersistence(options.persistenceDir)
  const wss = new WebSocket.Server({ noServer: true })
  wss.on('connection', setupWSConnection)
  return wss
}

exports.getYDoc = getYDoc

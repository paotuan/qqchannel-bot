const WebSocket = require('ws')
const setupWSConnection = require('./utils.cjs').setupWSConnection

exports.createWss = () => {
  const wss = new WebSocket.Server({ noServer: true })
  wss.on('connection', setupWSConnection)
  return wss
}

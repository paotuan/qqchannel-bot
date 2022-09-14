import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 4174 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    console.log('received: %s', data)
  })

  ws.send('something')
})

console.log('websocket server started')

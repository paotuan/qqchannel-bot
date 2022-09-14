const ws = new WebSocket('ws://localhost:4174');

ws.onopen = () => {
  ws.send('something')
}

ws.onmessage = (data) => {
  console.log('received: %s', data.data)
}

export {}

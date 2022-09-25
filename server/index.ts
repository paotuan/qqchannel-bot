import './wss'
import './qqApi'
import './service/common'
import './service/log'
import './service/note'
import './service/card'
import './service/dice'
import * as express from 'express'

if (process.env.NODE_ENV === 'production') {
  const server = express()
  server.use(express.static('dist'))
  server.listen(4175)
  console.log('后台已启动，请访问 http://localhost:4175')
}

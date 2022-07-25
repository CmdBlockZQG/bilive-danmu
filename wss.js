import { WebSocketServer } from 'ws'
import crypto from 'crypto'

const wss = new WebSocketServer({ port: 3001 })
const randomStr = (l = 16) => crypto.randomBytes(l).toString('base64url')
let clients = {}

wss.on('connection', (ws) => {
  const id = randomStr()
  clients[id] = ws
  ws.on('close', () => {
    delete clients[id]
  })
})

export default (data) => {
  for (let i of Object.keys(clients)) {
    clients[i].send(JSON.stringify(data))
  }
}
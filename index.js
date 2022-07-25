import Danmu from './danmu.js'
import db from './db.js'
import api from './api.js'
import wss from './wss.js'

const danmu = new Danmu(21402309)
// 关注真白花音喵 关注真白花音谢谢喵

danmu.connect()

danmu.on('disconnect', () => {
  console.log('* 从服务器断开连接，重连')
  danmu.connect() // 重连
})

danmu.on('ws', () => {
  console.log('* Websocket链接建立')
})

danmu.on('ready', () => {
  console.log('* 成功进入直播间')
  api()
})

danmu.on('danmu', (data) => {
  if (data.redbag !== 0) return
  wss(data)
  db('danmu').insert(data)
  const l = data.content.indexOf('【'),
        r = data.content.indexOf('】')
  if (l !== -1 && r !== -1 && l + 1 !== r) {
    console.log(data.content)
  }
})

danmu.on('sc', (data) => {
  wss(data)
  db('danmu').insert(data)
  console.log(`SC${data.price} ${data.user.name}: ${data.content}`)
})

danmu.on('liveOn', (data) => {
  db('live').insert({
    type: 1,
    time: data.time
  })
  console.log('开播', data)
})

danmu.on('liveOff', (data) => {
  db('live').insert({
    type: 0,
    time: data.time
  })
  console.log('下播', data)
})
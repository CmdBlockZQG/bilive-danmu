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
  wss({
    op: 'danmu',
    data: data
  })
  db('danmu').insert(data)
  if (data.content.match(/^【.*】$/)) {
    console.log(data.content)
  }
})

danmu.on('sc', (data) => {
  wss({
    op: 'sc',
    data: data
  })
  console.log(`SC${data.price} ${data.user.name}: ${data.content}`)
  db('sc').insert(data)
})

danmu.on('liveOn', (data) => {
  db('live').insert({
    type: true,
    time: data.time
  })
  console.log('开播', data)
})

danmu.on('liveOff', (data) => {
  db('live').insert({
    type: false,
    time: data.time
  })
  console.log('下播', data)
})
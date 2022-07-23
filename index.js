import Danmu from './danmu.js'
import db from './db.js'

const danmu = new Danmu(21402309)
// 关注真白花音喵 关注真白花音谢谢喵

danmu.connect()

danmu.on('disconnect', () => {
  console.log('* 从服务器断开连接，重连')
  danmu.connect() // 重连
})

danmu.on('ws', () => {
  console.log('* Websocket链接建立')
  // console.log(danmu.host)
  // console.log(danmu.token)
})

danmu.on('ready', () => {
  console.log('* 成功进入直播间')
})

danmu.on('unhandled', (cmd, data) => {
  console.log('未知数据包', cmd, data)
  db('unknown').insert({
    cmd,
    data
  })
})

danmu.on('DANMU_MSG', (data) => {
  db('danmu').insert(data)
})

danmu.on('SEND_GIFT', (data) => {
  db('gift').insert(data)
})

danmu.on('COMBO_SEND', (data) => {
  db('gift').insert(data)
})
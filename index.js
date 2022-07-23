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

danmu.on('danmu', (data) => {
  // console.log('弹幕', data)
  if (data.redbag !== 0) return
  console.log(`${data.user.name}: ${data.content}`)
  // db('danmu').insert(data)
})

danmu.on('sc', (data) => {
  // console.log('sc', data)
  console.log(`SC${data.price} ${data.user.name}: ${data.content}`)
  // db('sc').insert(data)
})

danmu.on('liveOn', (data) => {
  // console.log('开播', data)
})

danmu.on('liveOff', (data) => {
  // console.log('下播', data)
})
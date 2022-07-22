import Danmu from './danmu.js'

const danmu = new Danmu(545068)

danmu.connect()

danmu.on('disconnect', () => {
  console.log('从服务器断开连接')
})

danmu.on('packet', (data) => {
  // console.log(data)
  console.log('收到数据包')
})

danmu.on('act', (data) => {
  console.log('事件发生', data)
})

danmu.on('ws', () => {
  console.log('Websocket链接建立')
  console.log(danmu.host)
  console.log(danmu.token)
})

danmu.on('ready', () => {
  console.log('准备好了')
})

danmu.on('pop', (val) => {
  console.log(`人气值更新为${val}`)
})
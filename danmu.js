/*

const danmu = new Danmu(21402309)
// 关注真白花音喵 关注真白花音谢谢喵

danmu.connect()

danmu.on('disconnect', () => {
  console.log('* 从服务器断开连接，重连')
  danmu.connect() // 重连
})

danmu.on('packet', (data) => {
  console.log('收到数据包', data)
})

danmu.on('act', (data) => {
  console.log('事件发生', data)
})

danmu.on('ws', () => {
  console.log('* Websocket链接建立')
  console.log(danmu.host)
  console.log(danmu.token)
})

danmu.on('ready', () => {
  console.log('准备好了')
})

danmu.on('pop', (val) => {
  console.log(`人气值更新为${val}`)
})

danmu.on('unhandled', (cmd, data) => {
  console.log('未知数据包', cmd, data)
})

danmu.on('danmu', (data) => {
  console.log('弹幕', data)
})

danmu.on('sc', (data) => {
  console.log('sc', data)
})

danmu.on('liveOn', (data) => {
  console.log('开播', data)
})

danmu.on('liveOff', (data) => {
  console.log('下播', data)
})

danmu.on('事件名称', (data) => {
  console.log(data)
})

事件名称 提供原始数据
'DANMU_MSG' // 弹幕
'INTERACT_WORD' // 不知道什么玩意 但是贼多 还是从其他直播间来的
'WATCHED_CHANGE' // 看过的人数变化
'ONLINE_RANK_COUNT' // 在线人数排名变化
'ONLINE_RANK_V2' // 在线人数排名变化v2
'ONLINE_RANK_TOP3' // 在线人数排名前三
'HOT_RANK_CHANGED' // 热门排名变化
'HOT_RANK_CHANGED_V2' // 热门排名变化v2
'HOT_RANK_SETTLEMENT' // 上热门榜
'HOT_RANK_SETTLEMENT_V2' // 上热门榜v2
'HOT_ROOM_NOTIFY' // 热门房间通知？ 不懂
'TRADING_SCORE' // 应该是排名
'SEND_GIFT' // 送礼
'COMBO_SEND' // 连续送礼
'WIDGET_BANNER' // 不懂
'STOP_LIVE_ROOM_LIST' // 下播的房间
'ROOM_REAL_TIME_MESSAGE_UPDATE' // 一些信息更新
'ENTRY_EFFECT' // 欢迎进房
'ROOM_BLOCK_MSG' // 可能是禁言
'DANMU_AGGREGATION' // 很多弹幕的聚合体 都是抽奖弹幕
'NOTICE_MSG' // 通知，其他直播间的广播，本直播间上舰续舰
'USER_TOAST_MSG' // 跳框的消息 上舰续舰
'FULL_SCREEN_SPECIAL_EFFECT' // 全屏特效
'GUARD_BUY' // 上舰
'GUARD_HONOR_THOUSAND' // 千舰？
'ROOM_CHANGE' // 直播间标题分区修改
'LIVE' // 开播
'PREPARING' // 下播
'POPULARITY_RED_POCKET_START' // 发红包
'POPULARITY_RED_POCKET_NEW' // 新发红包
'POPULARITY_RED_POCKET_WINNER_LIST' // 红包中奖的人
'COMMON_NOTICE_DANMAKU' // 通知 红包给主播增加了多少粉丝
'SUPER_CHAT_MESSAGE' // SC
'SUPER_CHAT_MESSAGE_JPN' // SC翻译成日语
'SUPER_CHAT_MESSAGE_DELETE' // SC过期
*/
import WebSocket from 'ws'
import axios from 'axios'
import pako from 'pako'
import brotli from 'brotli'
import EventEmitter from 'events'

const makePacket = (op, data) => {
  let buf = Buffer.alloc(data.length + 16)
  buf.writeUIntBE(data.length + 16, 0, 4) // 封包总长度
  buf.writeUIntBE(16, 4, 2) // 封包头部长度
  buf.writeUIntBE(1, 6, 2) // 协议版本
  buf.writeUIntBE(op, 8, 4) // 操作码
  buf.writeUIntBE(1, 12, 4) // 序列号
  buf.write(data, 16) // 封包正文
  return buf
}

const readPacket = (buf) => {
  const totLen = buf.readUIntBE(0, 4), // 封包总长度
        headLen = buf.readUIntBE(4, 2), // 封包头部长度
        protover = buf.readUIntBE(6, 2), // 协议版本
        op = buf.readUIntBE(8, 4), // 操作码
        seq = buf.readUIntBE(12, 4), // 序列号
        raw = buf.subarray(headLen, totLen)// 原始数据
  return {
    totLen,
    headLen,
    protover,
    op,
    seq,
    raw
  }
}

const textDecoder = new TextDecoder('utf-8')

class Danmu extends EventEmitter {
  constructor(room) {
    super()

    this.room = room
  }

  async connect() {
    const { data: danmuInfo } = await axios.get(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=${this.room}&type=0`)
    this.token = danmuInfo.data.token
    this.host = danmuInfo.data.host_list[0].host

    this.ws = new WebSocket(`wss://${this.host}/sub`)

    this.ws.on('close', () => {
      this.emit('disconnect')
    })

    this.ws.on('message', (data) => {
      this.emit('packet', data)
      const body = this._decodePacket(data)
      body.forEach((i) => {
        let obj
        try {
          obj = JSON.parse(i)
        } catch {
          if (i.length > 1) i = i.slice(0, -1)
          try {
            obj = JSON.parse(i)
          } catch {
            return
          }
        }
        this.emit('act', obj)
        this._route(obj)
      })
    })

    this.ws.on('open', () => {
      this.emit('ws')
      
      // 发送认证包
      const data = JSON.stringify({
        uid: 0,
        roomid: this.room,
        protover: 3,
        platform: 'web',
        type: 2,
        key: this.token
      })
      this.ws.send(makePacket(7, data))
      
      // 开始发送心跳
      this.hbTimer = setInterval(() => {
        this.ws.send(makePacket(2, '[object Object]'))
      }, 1000 * 30)
    })
  }

  _decodePacket(pkt) {
    const data = readPacket(pkt)
    if (data.op === 3) { // 人气值更新
      this.emit('pop', data.raw.readUIntBE(0, 4))
      return []
    }
    if (data.op === 8) { // 进房
      this.emit('ready')
      return []
    }
    if (data.op !== 5) return []
    // 处理指令包
    let res
    switch (data.protover) {
      case 0:
        res = textDecoder.decode(data.raw)
        break
      case 2:
        res = textDecoder.decode(pako.inflate(data.raw))
        break
      case 3:
        res = textDecoder.decode(brotli.decompress(data.raw))
        break
      default:
        break
    }
    let ls = []
    for (;;) {
      let l = res.indexOf(`{"cmd`)
      if (l === -1) break

      let r = res.indexOf(`{"cmd`, l + 1)
      if (r === -1) r = res.length - 1
      r = res.lastIndexOf('}', r)

      ls.push(res.slice(l, r + 1))

      res = res.slice(r + 1)
    }
    return ls
  }

  _route(data) {
    if (data.data) {
      if (data.data.data) this.emit(data.cmd, data.data.data)
      else this.emit(data.cmd, data.data)
    } else {
      this.emit(data.cmd, data)
    }

    if (this.handlers[data.cmd]) {
      this.handlers[data.cmd](data)
    }
  }

  _simpleHandler = (data) => this.emit(data.cmd, data.data)

  handlers = {
    'DANMU_MSG': (data) => { // 弹幕消息
      const x = data.info
      let res = {
        content: x[1],
        time: x[0][4],
        type: x[0][12], // 0:文字 1:表情
        redbag: x[0][9], // 2: 抽奖 0：不是
        position: x[0][1], // 1:滚动 4:底端 5:顶端
        color: x[0][3].toString(16).toUpperCase(),
        user: {
          uid: x[2][0],
          name: x[2][1],
          ad: x[2][2], // 0:普通 1:房管
        }
      }
      if (x[3]) {
        res.medal = {
          level: x[3][0],
          name: x[3][1],
          boat: x[3][10], // 0:无 1:总督 2:提督 3:舰长
        }
      }
      this.emit('danmu', res)
    },
    'SUPER_CHAT_MESSAGE': (data) => {
      const x = data.data
      let res = {
        content: x.message,
        time: x.ts * 1000,
        price: x.price,
        user: {
          uid: x.uid,
          name: x.user_info.uname
        }
      }
      if (x.medal_info) {
        res.medal = {
          level: x.medal_info.medal_level,
          name: x.medal_info.medal_name,
          boat: x.medal_info.guard_level
        }
      }
      this.emit('sc', res)
    },
    'LIVE': (data) => {
      console.log(data)
      this.emit('liveOn', {
        time: Date.now()
      })
    },
    'PREPARING': (data) => {
      console.log(data)
      this.emit('liveOff', {
        time: Date.now()
      })
    }
  }
}

export default Danmu
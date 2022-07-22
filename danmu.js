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
          return
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
    res = res.replace(/.{"cmd/g, '\r\t\n{"cmd')
    return res.split('\r\t\n')
  }

  _route() {
    // TODO
  }
}

export default Danmu
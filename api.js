import express from 'express'
import { exec } from 'child_process'
import fs from 'fs'

import db from './db.js'

const app = express()

app.use('/api/video', express.static('video'))

app.get('/api/live', async (req, res) => { // 获取开播下播信息
  res.json(await db('live').find({}, { sort: { time: -1 } }))
})

app.get('/api/danmu/:l/:r', async (req, res) => { // 获取弹幕
  res.json(await db('danmu').find({
    time: {
      $gt: Number(req.params.l),
      $lt: Number(req.params.r)
    }
  }, {
    sort: { time: 1 }
  }))
})

app.get('/api/sc/:l/:r', async (req, res) => { // 获取SC
  res.json(await db('sc').find({
    time: {
      $gt: Number(req.params.l),
      $lt: Number(req.params.r)
    }
  }, {
    sort: { time: 1 }
  }))
})

app.post('/api/youget/:bv', async (req, res) => {
  console.log(`开始下载视频${req.params.bv}`)
  exec(`you-get https://www.bilibili.com/video/${req.params.bv} --no-caption -o ./video 1>/dev/null`, (err) => {
    if (err) console.log(`视频${req.params.bv}下载失败`, err)
    else console.log(`视频${req.params.bv}下载成功`)
  })
  res.send('ok')
})

app.get('/api/video', async (req, res) => {
  res.json(fs.readdirSync('./video'))
})

app.delete('/api/video/:file', async (req, res) => {
  fs.unlinkSync(`video/${req.params.file}`)
  res.send('ok')
})

export default () => {
  app.listen(3000)
}
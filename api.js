import express from 'express'

import db from './db.js'

const app = express()

// app.use(express.static('fe/dist'))

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

export default () => {
  app.listen(3000)
}
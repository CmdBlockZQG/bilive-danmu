import express from 'express'

import db from './db.js'

const app = express()

// app.use(express.static('fe/dist'))

app.get('/live', async (req, res) => {
  res.json(await db('live').find({}, { sort: { time: -1 } }))
})

app.get('/danmu/:l/:r', async (req, res) => {
  res.json(await db('danmu').find({
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
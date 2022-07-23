import mongodb from 'mongodb'
import conf from './config.js'

const client = new mongodb.MongoClient(conf.db)

client.connect(async err => {
  if (err) throw err
  console.log('* 数据库已连接')
})

export default (col) => {
  const collection = client.db(conf.dbName).collection(col)
  return {
    raw: () => collection,
    async insert (doc) {
      try {
        const res = Array.isArray(doc) ? await collection.insertMany(doc) : await collection.insertOne(doc)
        return res.insertedId || res.insertedIds
      } catch { return 0 }
    },
    async del (filter) {
      const res = await collection.deleteMany(filter)
      return res.acknowledged && res // 1 for success
    },
    async find (filter, opt = {}) {
      return await collection.find(filter, opt).toArray()
    },
    async put (filter, replace, upsert = true) {
      const res = await collection.replaceOne(filter, replace, { upsert })
      return res.acknowledged && res
    },
    async update (filter, update, upsert = false) {
      const res = await collection.updateOne(filter, { $set: update }, { upsert })
      return res.acknowledged && res
    },
    count: (filter, opt = {}) => collection.countDocuments(filter, opt)
  }
}
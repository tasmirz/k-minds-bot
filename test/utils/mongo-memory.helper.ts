import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

export async function startInMemoryMongo() {
  const mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri, { dbName: 'test' })
  return { mongod, uri }
}

export async function stopInMemoryMongo(mongod: MongoMemoryServer) {
  await mongoose.disconnect()
  await mongod.stop()
}

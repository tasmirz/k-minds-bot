import { Test, TestingModule } from '@nestjs/testing'
import { MongooseModule } from '@nestjs/mongoose'
import { getModelToken } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { startInMemoryMongo, stopInMemoryMongo } from '../../utils/mongo-memory.helper'
import { UsersService } from '../../../src/modules/users/users.service'
import { User, UserSchema } from '../../../src/modules/users/user.schema'

describe('UsersService (with in-memory Mongo)', () => {
  let mongod: any
  let module: TestingModule
  let usersService: UsersService

  beforeAll(async () => {
    const started = await startInMemoryMongo()
    mongod = started.mongod

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(started.uri, { dbName: 'test' }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UsersService],
    }).compile()

    usersService = module.get<UsersService>(UsersService)
  })

  afterAll(async () => {
    await module.close()
    await stopInMemoryMongo(mongod)
  })

  afterEach(async () => {
    const models = mongoose.connection.models
    for (const m of Object.keys(models)) {
      await models[m].deleteMany({})
    }
  })

  it('should create or update a discord user and find by discord id', async () => {
    const email = '2001999@stud.kuet.ac.bd'
    const name = 'Test User'
    const discordId = 123456789012345678n

    const user = await usersService.createOrUpdateDiscordUser(email, name, discordId, undefined)
    expect(user).toBeDefined()
    expect(user.email).toContain('2001')
    expect(user.name).toBe(name)

    const fetched = await usersService.findOneByDiscordId(discordId)
    expect(fetched).toBeDefined()
    expect(fetched?.email).toBe(user.email)
  })
})

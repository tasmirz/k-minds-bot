import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DiscordModule } from './discord/discord.module'

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/kminds',
    ),
    DiscordModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

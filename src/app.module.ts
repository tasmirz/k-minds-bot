import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { DiscordModule } from './discord/discord.module'
import { AppController } from './app.controller'

@Module({
  imports: [MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/kminds'), DiscordModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

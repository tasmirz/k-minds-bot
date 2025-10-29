import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { AuthCommands } from './commands/auth.commands';
import { UsersModule } from '../users/users.module';
import { OtpModule } from '../otp/otp.module';
import { discordConfig } from '../config/discord.config';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    NecordModule.forRoot(discordConfig),
    UsersModule,
    OtpModule,
  ],
  providers: [
    AuthCommands
  ],
  exports: [NecordModule],
})
export class DiscordModule {}

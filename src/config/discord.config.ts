import { IntentsBitField } from 'discord.js';
import { NecordModuleOptions } from 'necord';

export const discordConfig: NecordModuleOptions = {
  token: process.env.DISCORD_BOT_TOKEN as string,
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.DirectMessages,
  ],
  development:
    process.env.NODE_ENV === 'production'
      ? undefined
      : [process.env.DISCORD_GUILD_ID as string].filter(Boolean),
};

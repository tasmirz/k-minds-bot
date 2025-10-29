import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongoConfig: MongooseModuleOptions = {
  uri: process.env.MONGO_URI,
  retryAttempts: 3,
  retryDelay: 1000,
} as const;

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  ALUMNI = 'alumni',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ type: Number, default: null })
  batch: number;

  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ type: Number, unique: true, sparse: true })
  discordId: number;

  @Prop({ type: String, unique: true, sparse: true })
  telegramId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  status: number;

  @Prop({ type: String })
  term: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

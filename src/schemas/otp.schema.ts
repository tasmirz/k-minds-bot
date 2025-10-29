import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OTPCode } from '../interfaces/otp.interface';

export type OtpDocument = Otp & Document & OTPCode;

@Schema({ timestamps: true })
export class Otp extends Document implements OTPCode {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, name: 'expires_at' })
  expires_at: Date;

  @Prop({ required: true, type: BigInt, name: 'discord_id' })
  discord_id: bigint;

  @Prop({ name: 'created_at' })
  created_at: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

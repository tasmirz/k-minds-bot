import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { OTPCode } from '../../common/interfaces/otp.interface'

export type OtpDocument = Otp & Document & OTPCode & {
  _id: string;
  created_at: Date;
}

@Schema({ timestamps: true })
export class Otp extends Document implements OTPCode {
  @Prop({ required: true })
  email: string

  @Prop({ required: true })
  code: string

  @Prop({ required: true, name: 'expires_at' })
  expires_at: Date

  @Prop({ required: true, type: BigInt, name: 'discord_id' })
  discord_id: bigint

  @Prop({ name: 'created_at' })
  created_at: Date
}

export const OtpSchema = SchemaFactory.createForClass(Otp)

// TTL index that automatically removes documents after expires_at
OtpSchema.index(
  { expires_at: 1 },
  {
    expireAfterSeconds: 0, // This means the document will be removed at the exact time specified in expires_at
    partialFilterExpression: { expires_at: { $exists: true } } // Only apply to documents with expires_at field
  }
);

// Index for faster lookups by discord_id
OtpSchema.index({ discord_id: 1 });

// Compound index for faster verification lookups
OtpSchema.index({ discord_id: 1, code: 1 });

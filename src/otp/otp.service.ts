import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import * as crypto from 'crypto';
import { otpConfig } from '../config/otp.config';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(@InjectModel(Otp.name) private otpModel: Model<OtpDocument>) {}

  async createOtp(email: string, discordId: bigint): Promise<string> {
    const recentOtp = await this.otpModel.findOne({
      email,
      created_at: {
        $gt: new Date(Date.now() - otpConfig.cooldown * 1000),
      },
    });

    if (recentOtp) {
      const createdAt = new Date(recentOtp.created_at);
      const remainingTime = Math.ceil(
        (createdAt.getTime() + otpConfig.cooldown * 1000 - Date.now()) / 1000,
      );
      throw new Error(
        `Please wait ${remainingTime} seconds before requesting a new OTP`,
      );
    }

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + otpConfig.expiresIn);

    await this.otpModel.create({
      email,
      code,
      expires_at: expiresAt,
      discord_id: discordId,
    });

    return code;
  }

  async verifyOtp(code: string, discordId: bigint): Promise<string> {
    const otp = await this.otpModel.findOneAndDelete({
      code,
      discord_id: discordId,
      expires_at: { $gt: new Date() },
    });

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    return otp.email;
  }

  private generateOtp(): string {
    const buffer = crypto.randomBytes(Math.ceil(otpConfig.length / 2));
    return buffer.toString('hex').slice(0, otpConfig.length);
  }
}

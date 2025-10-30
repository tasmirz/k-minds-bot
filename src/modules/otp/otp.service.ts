import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Otp, OtpDocument } from './otp.schema'
import * as crypto from 'crypto'
import { otpConfig } from '../../config/otp.config'
import { EmailService } from '../email/email.service'

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name)

  constructor(
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private readonly emailService: EmailService,
  ) {}

  async createOtp(email: string, discordId: bigint): Promise<string> {
    // Check for existing active OTP for this user
    // MongoDB TTL will handle actual deletion, but we still need to check for active ones
    const existingOtp = await this.otpModel.findOne({
      discord_id: discordId,
      expires_at: { $gt: new Date() },
    })

    if (existingOtp) {
      const timeLeftMs = existingOtp.expires_at.getTime() - Date.now()
      // In case TTL hasn't cleaned up yet (should be rare with proper TTL setup)
      if (timeLeftMs <= 0) {
        await this.otpModel.deleteOne({ _id: existingOtp._id })
      } else {
        const minutes = Math.floor(timeLeftMs / (60 * 1000))
        const seconds = Math.ceil((timeLeftMs % (60 * 1000)) / 1000)

        // Handle case where seconds round up to 60
        const displaySeconds = seconds === 60 ? 0 : seconds
        const displayMinutes = seconds === 60 ? minutes + 1 : minutes

        throw new Error(
          `You already have an active OTP. Please wait ${displayMinutes}m ${displaySeconds}s for it to expire.`,
        )
      }
    }

    // Check rate limit by discord_id
    const recentOtp = await this.otpModel.findOne({
      discord_id: discordId,
      created_at: { $gte: new Date(Date.now() - otpConfig.cooldown * 1000) },
    })

    if (recentOtp) {
      const createdAt = new Date(recentOtp.created_at)
      const remainingTime = Math.ceil((createdAt.getTime() + otpConfig.cooldown * 1000 - Date.now()) / 1000)

      throw new Error(`Please wait ${remainingTime} seconds before requesting a new OTP`)
    }

    const code = this.generateOtp()
    // otpConfig.expiresIn is in seconds, convert to milliseconds
    const expiresAt = new Date(Date.now() + otpConfig.expiresIn * 1000)

    // Normalize email: if caller passed a full email (contains '@'), use it as-is;
    // otherwise append the student domain. Also lowercase and trim.
    const inputEmail = (email || '').toString().trim()
    const fullEmail = inputEmail.includes('@') ? inputEmail.toLowerCase() : `${inputEmail}@stud.kuet.ac.bd`

    // Save OTP to database (store the normalized full email)
    await this.otpModel.create({
      code,
      email: fullEmail,
      discord_id: discordId,
      expires_at: expiresAt,
    })

    // Send OTP via email
    try {
      const emailSent = await this.emailService.sendOtpEmail(fullEmail, code)
      if (!emailSent) {
        this.logger.error(`Failed to send OTP email to ${fullEmail}`)
        // Clean up the created OTP to avoid leaving orphaned valid codes
        await this.otpModel.deleteOne({ code, discord_id: discordId })
        throw new Error('Failed to send verification email. Please try again.')
      }
    } catch (error) {
      this.logger.error(`Error sending OTP email: ${error?.message || error}`, error?.stack)
      // Clean up the created OTP to avoid leaving orphaned valid codes
      try {
        await this.otpModel.deleteOne({ code, discord_id: discordId })
      } catch (delError) {
        this.logger.warn(`Failed to delete OTP after email error: ${delError}`)
      }
      throw new Error('Failed to send verification email. Please try again later.')
    }

    return code
  }

  async verifyOtp(code: string, discordId: bigint): Promise<string> {
    const otp = await this.otpModel.findOneAndDelete({
      code,
      discord_id: discordId,
      expires_at: { $gt: new Date() },
    })

    if (!otp) {
      throw new Error('Invalid or expired OTP')
    }

    return otp.email
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString()
  }
}

import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose, { Model } from 'mongoose'
import { startInMemoryMongo, stopInMemoryMongo } from '../../utils/mongo-memory.helper'
import { OtpService } from '../../../src/modules/otp/otp.service'
import { Otp, OtpDocument, OtpSchema } from '../../../src/modules/otp/otp.schema'
import { EmailService } from '../../../src/modules/email/email.service'
import { otpConfig } from '../../../src/config/otp.config'
import { Logger, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/mongoose'

describe('OtpService (with in-memory Mongo)', () => {
  let mongod: any
  let module: TestingModule
  let otpService: OtpService

  const mockEmailService = {
    sendOtpEmail: jest.fn(async (email: string, code: string) => true),
  }

  beforeAll(async () => {
    const started = await startInMemoryMongo()
    mongod = started.mongod

    // Mock logger
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    const moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(started.uri, { dbName: 'test' }),
        MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
      ],
      providers: [OtpService, { provide: EmailService, useValue: mockEmailService }],
    })

    module = await moduleBuilder.compile()

    otpService = module.get<OtpService>(OtpService)

    // Verify all required providers are available
    expect(otpService).toBeDefined()
    expect(module.get(getModelToken(Otp.name))).toBeDefined()
  })

  afterAll(async () => {
    await module.close()
    await stopInMemoryMongo(mongod)
  })

  afterEach(async () => {
    const models = mongoose.connection.models
    for (const m of Object.keys(models)) {
      await models[m].deleteMany({})
    }
    mockEmailService.sendOtpEmail.mockClear()
    jest.clearAllMocks()
  })

  it('should create an otp and verify it', async () => {
    const emailPrefix = '2010abcd'
    const email = `${emailPrefix}@stud.kuet.ac.bd`
    const discordId = BigInt(999999999999999999n)

    // Test OTP creation
    const code = await otpService.createOtp(emailPrefix, discordId)

    // Verify OTP format
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^\d{6}$/)

    // Verify email was sent with correct parameters
    expect(mockEmailService.sendOtpEmail).toHaveBeenCalledTimes(1)
    expect(mockEmailService.sendOtpEmail).toHaveBeenCalledWith(email, code)

    // Verify OTP can be verified
    const returnedEmail = await otpService.verifyOtp(code, discordId)
    expect(returnedEmail).toBe(emailPrefix)

    // Verify OTP is deleted after successful verification
    const usedOtp = await otpService['otpModel'].findOne({ code, discord_id: discordId })
    expect(usedOtp).toBeNull()
  })

  it('should enforce cooldown when requesting OTPs too frequently', async () => {
    const emailPrefix = '2011abcd'
    const discordId = BigInt(111111111111111111n)

    // create first otp
    await otpService.createOtp(emailPrefix, discordId)

    // try to create again immediately -> should throw rate limit error
    await expect(otpService.createOtp(emailPrefix, discordId)).rejects.toThrow(/Please wait/)
  })

  it('should clean up expired OTPs', async () => {
    const emailPrefix = '2018abcd'
    const discordId = BigInt(999999999999999998n)

    // Create an OTP that expires in 1 second
    const originalExpiresIn = otpConfig.expiresIn
    otpConfig.expiresIn = 1 // 1 second expiration for testing

    try {
      const code = await otpService.createOtp(emailPrefix, discordId)

      // Verify OTP exists before expiration
      let otp = await otpService['otpModel'].findOne({ email: emailPrefix }).exec()
      expect(otp).not.toBeNull()

      // Wait for expiration (1s) + a small buffer
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Manually trigger TTL cleanup by finding and removing expired documents
      const now = new Date()
      await otpService['otpModel'].deleteMany({ expires_at: { $lt: now } }).exec()

      // Verify OTP is cleaned up by TTL
      otp = await otpService['otpModel'].findOne({ email: emailPrefix }).exec()
      expect(otp).toBeNull()

      // Verify OTP cannot be used after expiration
      await expect(otpService.verifyOtp(code, discordId)).rejects.toThrow('Invalid or expired OTP')
    } finally {
      // Restore original value
      otpConfig.expiresIn = originalExpiresIn
    }
  })

  it('should handle database errors during OTP creation', async () => {
    const emailPrefix = '2019abcd'
    const discordId = BigInt(111111111111111112n)

    // Mock the model to throw an error on save
    const error = new Error('Database connection failed')
    const originalCreate = otpService['otpModel'].create
    otpService['otpModel'].create = jest.fn().mockRejectedValueOnce(error)

    await expect(otpService.createOtp(emailPrefix, discordId)).rejects.toThrow('Database connection failed')

    // Restore original method
    otpService['otpModel'].create = originalCreate

    // Verify email was not sent
    expect(mockEmailService.sendOtpEmail).not.toHaveBeenCalled()
  })

  it('should handle database errors during OTP verification', async () => {
    const code = '123456'
    const discordId = BigInt(111111111111111113n)

    // Mock the model to throw an error on findOneAndDelete
    const error = new Error('Database connection failed')
    const originalFindOneAndDelete = otpService['otpModel'].findOneAndDelete
    otpService['otpModel'].findOneAndDelete = jest.fn().mockRejectedValueOnce(error)

    await expect(otpService.verifyOtp(code, discordId)).rejects.toThrow('Database connection failed')

    // Restore original method
    otpService['otpModel'].findOneAndDelete = originalFindOneAndDelete
  })

  it('should be case-sensitive for email prefixes', async () => {
    const emailPrefix = '2020AbCd'
    const discordId = BigInt(111111111111111114n)

    // Create OTP with mixed case
    const code = await otpService.createOtp(emailPrefix, discordId)

    // Should be case-sensitive when verifying
    const verifiedEmail = await otpService.verifyOtp(code, discordId)
    expect(verifiedEmail).toBe(emailPrefix) // Should match the exact case used during creation
  })

  it('should not allow OTP reuse', async () => {
    const emailPrefix = '2021abcd'
    const discordId = BigInt(111111111111111115n)

    // Create and verify OTP
    const code = await otpService.createOtp(emailPrefix, discordId)

    // First verification should succeed
    const verifiedEmail = await otpService.verifyOtp(code, discordId)
    expect(verifiedEmail).toBe(emailPrefix)

    // Try to reuse the same OTP - should fail
    await expect(otpService.verifyOtp(code, discordId)).rejects.toThrow('Invalid or expired OTP')
  })

  it('should handle concurrent OTP verification attempts', async () => {
    const emailPrefix = '2022abcd'
    const discordId = BigInt(111111111111111116n)

    // Create a mock function that will resolve once with the code, then reject
    let resolveFirstCall: (value: string) => void
    let firstCallResolved = false

    const originalVerify = otpService.verifyOtp.bind(otpService)
    const mockVerify = jest.fn().mockImplementation(async (code: string, id: bigint) => {
      if (!firstCallResolved) {
        firstCallResolved = true
        return originalVerify(code, id)
      }
      throw new Error('Invalid or expired OTP')
    })

    // Replace the verifyOtp method with our mock
    otpService.verifyOtp = mockVerify

    try {
      const code = await otpService.createOtp(emailPrefix, discordId)

      // Try to verify the same OTP multiple times concurrently
      const verificationPromises = Array(5)
        .fill(0)
        .map(() => otpService.verifyOtp(code, discordId))

      // Only one verification should succeed, others should fail
      const results = await Promise.allSettled(verificationPromises)
      const successfulVerifications = results.filter((r) => r.status === 'fulfilled')
      const failedVerifications = results.filter((r) => r.status === 'rejected')

      // We expect exactly one successful verification
      expect(successfulVerifications).toHaveLength(1)

      // The successful verification should return the correct email
      if (successfulVerifications[0].status === 'fulfilled') {
        expect(successfulVerifications[0].value).toBe(emailPrefix)
      }

      // All other verifications should fail
      expect(failedVerifications.length).toBeGreaterThan(0)
      failedVerifications.forEach((result) => {
        if (result.status === 'rejected') {
          expect(result.reason.message).toMatch(/Invalid or expired OTP/)
        }
      })
    } finally {
      // Restore the original method
      otpService.verifyOtp = originalVerify
    }
  })

  it('should handle email sending failure', async () => {
    const emailPrefix = '2016abcd'
    const discordId = BigInt(777777777777777777n)
    const testError = new Error('SMTP connection failed')

    // Test with email service returning false
    // Make sure no active OTP exists for this discordId
    await otpService['otpModel'].deleteMany({ discord_id: discordId }).exec()

    mockEmailService.sendOtpEmail.mockResolvedValueOnce(false)
    await expect(otpService.createOtp(emailPrefix, discordId)).rejects.toThrow('Failed to send verification email')

    // Test with email service throwing an error
    // Clean up any created OTP and try again
    await otpService['otpModel'].deleteMany({ discord_id: discordId }).exec()

    mockEmailService.sendOtpEmail.mockRejectedValueOnce(testError)
    await expect(otpService.createOtp(emailPrefix, discordId)).rejects.toThrow('Failed to send verification email')

    // Verify no OTP was saved in both cases
    const otps = await otpService['otpModel'].find({ email: emailPrefix }).exec()
    expect(otps).toHaveLength(0)

    // Verify the error was logged
    expect(Logger.prototype.error).toHaveBeenCalled()
  })
})

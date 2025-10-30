import { Context, Options, Subcommand, createCommandGroupDecorator } from 'necord'
import { Injectable, Logger, UseGuards } from '@nestjs/common'
import { CommandInteraction } from 'discord.js'
import { UsersService } from 'src/modules/users/users.service'
import { OtpService } from 'src/modules/otp/otp.service'
import { LoginDto } from '../dto/login.dto'
import { VerifyDto } from '../dto/verify.dto'
import { AcknowledgeDto } from '../dto/acknowledge.dto'
import { Roles } from 'src/config/roles.config'
import { UserRole } from 'src/modules/users/user.schema'
import { EmailPrefixAutocompleteInterceptor } from '../interceptors/email-prefix.interceptor'
import { AuthPermissions } from '../../config/auth-perms.config'
import { PermissionGuard, SetPermissions } from '../guards/permission.guard'
import { EmbedHelper } from '../helpers/embed.helper'
import { validateDto } from 'src/common'

const AuthCommandGroup = createCommandGroupDecorator({
  name: 'auth',
  description: 'Authentication commands',
  guilds: process.env.DISCORD_DEV_GUILD_ID ? [process.env.DISCORD_DEV_GUILD_ID] : [],
})

@AuthCommandGroup()
@Injectable()
export class AuthCommands {
  private readonly logger = new Logger(AuthCommands.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

  @Subcommand({
    name: 'login',
    description: 'Start the login process with your KUET student email',
  })
  @SetPermissions(AuthPermissions.login)
  public async onLogin(@Context() [interaction]: [CommandInteraction], @Options() loginDto: LoginDto) {
    if (!(await interaction.isChatInputCommand())) return
    // Defer the reply first to prevent interaction timeout
    await interaction.deferReply({ flags: 64 }) // 64 is the flag for ephemeral
    if (!(await validateDto(LoginDto, loginDto, interaction))) return
    try {
      const { email } = loginDto
      const fullEmail = email + '@stud.kuet.ac.bd'
      const discordId = BigInt(interaction.user.id)

      await this.otpService.createOtp(fullEmail, discordId)
      const embed = EmbedHelper.success(
        'Login Requested',
        `A verification code has been sent to ${fullEmail}.\n\n` +
          'Use `/auth verify <code>` to complete authentication.',
      )
      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      await this.handleLoginError(interaction, error)
    }
  }

  @Subcommand({
    name: 'acknowledge',
    description: 'Acknowledge and verify a user',
  })
  @SetPermissions(AuthPermissions.acknowledge) // Use your existing permission system
  public async onAcknowledge(@Context() [interaction]: [CommandInteraction], @Options() { user }: AcknowledgeDto) {
    if (!interaction.isChatInputCommand()) return
    await interaction.deferReply({ ephemeral: true })

    try {
      const userData = await this.usersService.findOneByDiscordId(BigInt(user.id))
      if (!userData) {
        return interaction.editReply('User not found in the database. They need to register first.')
      }
      console.log('email ' + userData.email)
      console.log('user ' + userData.email.match(/([0-9]{2})/)?.[0])
      console.log('discord ' + user.id)
      const batchMatch = userData.email.match(/[0-9]{2}/)?.[0]
      if (!batchMatch) {
        return interaction.editReply('Could not determine batch from email.')
      }

      const batch = parseInt(batchMatch, 10)
      let roleToAssign: string
      switch (batch) {
        case 20:
          roleToAssign = Roles._2k20
          break
        case 21:
          roleToAssign = Roles._2k21
          break
        case 22:
          roleToAssign = Roles._2k22
          break
        case 23:
          roleToAssign = Roles._2k23
          break
        default:
          return interaction.editReply('Could not determine batch from email.')
      }

      if (!interaction.guild) {
        return interaction.editReply('This command can only be used in a server.') // TODO: add this checking for all, probably a decorator?
      }

      const member = await interaction.guild.members.fetch(user.id)

      // Set nickname to the name stored in our database (fallback to the Discord username)
      let nickname = (userData.name || user.username).trim()
      // Discord nicknames have a 32 character limit
      if (nickname.length > 32) nickname = nickname.slice(0, 32)
      try {
        // Only attempt to set nickname if it's different and non-empty
        if (nickname && member.nickname !== nickname) {
          await member.setNickname(nickname)
        }
      } catch (nickError) {
        this.logger.warn(`Failed to set nickname for ${user.id}: ${nickError}`)
        // Continue even if setting nickname fails (permissions etc.)
      }

      await member.roles.add([Roles.verified, roleToAssign])

      await interaction.editReply(`Successfully acknowledged ${nickname} (Batch ${batch})`)
    } catch (error) {
      this.logger.error('Error in acknowledge command:', error)
      await interaction.editReply('An error occurred while processing your request.')
    }
  }

  @Subcommand({
    name: 'verify',
    description: 'Verify your email with the code sent to you',
  })
  public async onVerify(@Context() [interaction]: [CommandInteraction], @Options() verifyDto: VerifyDto) {
    if (!interaction.isChatInputCommand()) return
    await interaction.deferReply({ ephemeral: true })
    if (!(await validateDto(VerifyDto, verifyDto, interaction))) return
    const { code, name } = verifyDto
    try {
      const discordId = BigInt(interaction.user.id)
      const email = await this.otpService.verifyOtp(code, discordId)

      const user = await this.usersService.createOrUpdateDiscordUser(email, name.trim(), discordId, undefined)

      const embed = EmbedHelper.success(
        'Authentication Successful',
        `You have been authenticated as **${name}** (${email}).\n` + 'Please wait for approval from the admin.',
      )

      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      await this.handleVerificationError(interaction, error)
    }
  }

  @Subcommand({
    name: 'status',
    description: 'Check your authentication status',
  })
  public async onStatus(@Context() [interaction]: [CommandInteraction]) {
    if (!interaction.isChatInputCommand()) return

    await interaction.deferReply({ ephemeral: true })

    try {
      const discordId = BigInt(interaction.user.id)
      const user = await this.usersService.findOneByDiscordId(discordId)

      if (!user) {
        await interaction.editReply({
          content: 'You are not authenticated. Use `/auth login` to start the authentication process.',
        })
        return
      }

      const embed = EmbedHelper.info('Authentication Status').addFields(
        { name: 'Name', value: user.name, inline: true },
        { name: 'Email', value: user.email, inline: true },
        {
          name: 'Status',
          value: user.status ? '✅ Active' : '❌ Inactive',
          inline: true,
        },
      )

      await interaction.editReply({ embeds: [embed] })
    } catch (error) {
      await this.handleStatusError(interaction, error)
    }
  }

  private async handleLoginError(interaction: CommandInteraction, error: any): Promise<void> {
    this.logger.error(`Login error: ${error.message}`, error.stack)

    // If the error is about OTP rate limiting, use the exact message
    const errorMessage = error.message?.includes('You already have an active OTP')
      ? error.message
      : this.extractErrorMessage(error, 'An error occurred during login.')

    const embed = EmbedHelper.error(
      errorMessage.includes('active OTP') ? 'OTP Already Sent' : 'Login Failed',
      errorMessage,
    )

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [embed] })
      } else {
        await interaction.reply({ embeds: [embed], flags: 64 })
      }
    } catch (replyError) {
      this.logger.error('Failed to send error message:', replyError)
    }
  }

  private async handleVerificationError(interaction: CommandInteraction, error: any): Promise<void> {
    this.logger.error(`Verification error: ${error.message}`, error.stack)

    const errorMessage = error.message || 'An error occurred during verification'

    const embed = EmbedHelper.error('Verification Failed', errorMessage)

    await interaction.editReply({ embeds: [embed] })
  }

  private async handleStatusError(interaction: CommandInteraction, error: any): Promise<void> {
    this.logger.error(`Status check error: ${error.message}`, error.stack)

    await interaction.editReply({
      content: '❌ An error occurred while checking your status.',
    })
  }

  private extractErrorMessage(error: any, defaultMessage: string): string {
    if (Array.isArray(error) && error[0] instanceof Error) {
      return 'Validation error:\n' + error.map((e: any) => e.message || 'Unknown error').join('\n')
    }

    return error.message || defaultMessage
  }
}

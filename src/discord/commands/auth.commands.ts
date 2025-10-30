import {
  Context,
  Options,
  Subcommand,
  createCommandGroupDecorator,
} from 'necord'
import { Injectable, Logger, UseGuards } from '@nestjs/common'
import { CommandInteraction } from 'discord.js'
import { UsersService } from 'src/modules/users/users.service'
import { OtpService } from 'src/modules/otp/otp.service'
import { LoginDto } from '../dto/login.dto'
import { ValidateDto } from 'src/common/decorators/validate-dto.decorator'
import { VerifyDto } from '../dto/verify.dto'
import { EmailPrefixAutocompleteInterceptor } from '../interceptors/email-prefix.interceptor'
import { AuthPermissions } from '../../config/auth-perms.config'
import { PermissionGuard, SetPermissions } from '../guards/permission.guard'
import { EmbedHelper } from '../helpers/embed.helper'

const AuthCommandGroup = createCommandGroupDecorator({
  name: 'auth',
  description: 'Authentication commands',
  guilds: process.env.DISCORD_DEV_GUILD_ID
    ? [process.env.DISCORD_DEV_GUILD_ID]
    : [],
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
  @ValidateDto(LoginDto)
  public async onLogin(
    @Context() [interaction]: [CommandInteraction],
    @Options() loginDto: LoginDto,
  ) {
    if (!interaction.isChatInputCommand()) return

    await interaction.deferReply({ ephemeral: true })

    try {
      const { email } = loginDto
      const fullEmail = email + '@stud.kuet.ac.bd'
      const discordId = BigInt(interaction.user.id)

      await this.otpService.createOtp(email, discordId)

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
    name: 'verify',
    description: 'Verify your email with the code sent to you',
  })
  @ValidateDto(VerifyDto)
  public async onVerify(
    @Context() [interaction]: [CommandInteraction],
    @Options() { code, name }: VerifyDto,
  ) {
    if (!interaction.isChatInputCommand()) return

    await interaction.deferReply({ ephemeral: true })

    try {
      const discordId = BigInt(interaction.user.id)
      const email = await this.otpService.verifyOtp(code, discordId)

      const user = await this.usersService.createOrUpdateDiscordUser(
        email,
        name.trim(),
        discordId,
        undefined,
      )

      const embed = EmbedHelper.success(
        'Authentication Successful',
        `You have been authenticated as **${name}** (${email}).\n` +
          `**Role:** ${user.role}\n` +
          `**Term:** ${user.term || 'Not set'}`,
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
          content:
            'You are not authenticated. Use `/auth login` to start the authentication process.',
        })
        return
      }

      const embed = EmbedHelper.info('Authentication Status').addFields(
        { name: 'Name', value: user.name, inline: true },
        { name: 'Email', value: user.email, inline: true },
        { name: 'Role', value: user.role, inline: true },
        { name: 'Term', value: user.term || 'Not set', inline: true },
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

  private async handleLoginError(
    interaction: CommandInteraction,
    error: any,
  ): Promise<void> {
    this.logger.error(`Login error: ${error.message}`, error.stack)

    const errorMessage = this.extractErrorMessage(
      error,
      'An error occurred during login.',
    )

    const embed = EmbedHelper.error('Login Failed', errorMessage)

    await interaction.editReply({ embeds: [embed] })
  }

  private async handleVerificationError(
    interaction: CommandInteraction,
    error: any,
  ): Promise<void> {
    this.logger.error(`Verification error: ${error.message}`, error.stack)

    const errorMessage =
      error.message || 'An error occurred during verification'

    const embed = EmbedHelper.error('Verification Failed', errorMessage)

    await interaction.editReply({ embeds: [embed] })
  }

  private async handleStatusError(
    interaction: CommandInteraction,
    error: any,
  ): Promise<void> {
    this.logger.error(`Status check error: ${error.message}`, error.stack)

    await interaction.editReply({
      content: '❌ An error occurred while checking your status.',
    })
  }

  private extractErrorMessage(error: any, defaultMessage: string): string {
    if (Array.isArray(error) && error[0] instanceof Error) {
      return (
        'Validation error:\n' +
        error.map((e: any) => e.message || 'Unknown error').join('\n')
      )
    }

    return error.message || defaultMessage
  }
}

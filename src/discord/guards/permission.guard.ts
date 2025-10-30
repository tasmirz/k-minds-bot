import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  applyDecorators,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ShortCircuitInterceptor } from '../interceptors/short-circuit.interceptor'
import { Reflector } from '@nestjs/core'
import { Permission } from '../../common/interfaces/permission.interface'
import { permissionsKey } from 'src/config/constants.config'
import { AutocompleteInteraction, MessageFlags } from 'discord.js'
import { EmbedHelper } from '../helpers/embed.helper'
export function SetPermissions(permission: Permission) {
  return applyDecorators(
    SetMetadata(permissionsKey, permission),
    UseGuards(PermissionGuard),
    UseInterceptors(ShortCircuitInterceptor),
  )
}

export function ApplyPermissions(permission: Permission) {
  return function (constructor: Function) {
    const methodNames = Object.getOwnPropertyNames(constructor.prototype)
      .filter((name) => name !== 'constructor')
      .filter((name) => typeof constructor.prototype[name] === 'function')

    methodNames.forEach((methodName) => {
      applyPermissionToMethod(constructor.prototype, methodName, permission)
    })

    return constructor
  }
}

function applyPermissionToMethod(
  prototype: any,
  methodName: string,
  newPermission: Permission,
) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName)
  if (!descriptor) return

  const existingPermission =
    Reflect.getMetadata(permissionsKey, prototype, methodName) || {}
  const mergedPermission = { ...existingPermission, ...newPermission }

  Reflect.defineMetadata(
    permissionsKey,
    mergedPermission,
    prototype,
    methodName,
  )
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const interaction = context.getArgByIndex(0)[0]
    if (interaction instanceof AutocompleteInteraction) return true // TODO: return empty

    //read matadata
    const permission: Permission = this.getPermissions(context)
    const channelId = interaction.channelId
    const userId = interaction.user.id
    // Check channel permission
    if (!this.checkChannelPermission(permission, channelId)) {
      await interaction.reply({
        embeds: [
          EmbedHelper.error(
            'Permission Denied',
            'You are not allowed to use this command (channel)',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
      ;(interaction as any)._shortCircuited = true
      return true
    }

    // Check if user is blocked
    if (this.isUserBlocked(permission, userId)) {
      await interaction.reply({
        embeds: [
          EmbedHelper.error(
            'Permission Denied',
            'You are blocked from using this command',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
      ;(interaction as any)._shortCircuited = true
      return true
    }

    // Check if user is allowed
    if (!this.isUserAllowed(permission, userId)) {
      await interaction.reply({
        embeds: [
          EmbedHelper.error(
            'Permission Denied',
            'You are not allowed to use this command',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
      ;(interaction as any)._shortCircuited = true
      return true
    }

    // Check if role is blocked
    if (
      this.isRoleBlocked(
        permission,
        interaction.member?.roles?.cache?.map((r) => r.id) || [],
      )
    ) {
      await interaction.reply({
        embeds: [
          EmbedHelper.error(
            'Permission Denied',
            'You are blocked from using this command (role)',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
      ;(interaction as any)._shortCircuited = true
      return true
    }

    // Check if role is allowed
    if (
      !this.isRoleAllowed(
        permission,
        interaction.member?.roles?.cache?.map((r) => r.id) || [],
      )
    ) {
      await interaction.reply({
        embeds: [
          EmbedHelper.error(
            'Permission Denied',
            'You are not allowed to use this command (role)',
          ),
        ],
        flags: MessageFlags.Ephemeral,
      })
      ;(interaction as any)._shortCircuited = true
      return true
    }

    return true
  }

  private checkChannelPermission(
    permission: Permission,
    channel: string,
  ): boolean {
    if (!permission.channels) return true
    if (permission.channels.forbidden?.includes(channel)) return false
    if (
      permission.channels.allowed &&
      !permission.channels.allowed.includes(channel)
    )
      return false
    return true
  }

  private isUserBlocked(permission: Permission, userId: string): boolean {
    if (!permission.users) return false
    if (permission.users.forbidden?.includes(userId)) return true
    return false
  }

  private isUserAllowed(permission: Permission, userId: string): boolean {
    if (!permission.users) return true
    if (permission.users?.allowed?.includes(userId)) return true
    return false
  }

  private isRoleBlocked(permission: Permission, userId: string): boolean {
    if (!permission.roles) return false
    if (permission.roles.forbidden?.includes(userId)) return true
    return false
  }

  private isRoleAllowed(permission: Permission, userId: string): boolean {
    if (!permission.roles) return true
    if (permission.roles.allowed?.includes(userId)) return true
    return false
  }

  private getPermissions(context: ExecutionContext): Permission {
    return (
      this.reflector.get<Permission>(permissionsKey, context.getHandler()) ||
      this.reflector.get<Permission>(permissionsKey, context.getClass())
    )
  }
}

import { Permission } from '../common/interfaces/permission.interface'
import { Roles } from './roles.config'
import { Channels } from './channels.config'

export const AuthPermissions = {
  login: {
    channels: {
      allowed: new Set([Channels.verification]),
    },

    roles: {
      forbidden: new Set([Roles.verified]), // Verified users cannot use login command
    },
  } as const satisfies Permission,

  verify: {
    channels: {
      allowed: new Set([Channels.verification, Channels.dm]),
    },
    roles: {
      forbidden: new Set([Roles.verified]), // Verified users cannot use verify command
    },
  } as const satisfies Permission,

  acknowledge: {
    roles: {
      allowed: new Set([Roles.manager]), // Only users with manager role can use this
    },
    channels: {
      allowed: new Set([Channels.verification]),
    },
  } as const satisfies Permission,

  status: {} as const satisfies Permission,
} as const

export type AuthPermissionKey = keyof typeof AuthPermissions

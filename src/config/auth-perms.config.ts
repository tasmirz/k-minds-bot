import { Permission } from '../common/interfaces/permission.interface'
import { Roles } from './roles.config'
import { Channels } from './channels.config'

export const AuthPermissions = {
  login: {
    channels: {
      allowed: [Channels.verification],
    },
  } as const satisfies Permission,

  verify: {
    channels: {
      allowed: [Channels.verification, Channels.dm],
    },
  } as const satisfies Permission,

  status: {} as const satisfies Permission,
} as const

export type AuthPermissionKey = keyof typeof AuthPermissions

# KMINDS Discord Bot

## Available Commands

### Authentication Commands

#### `/auth login <email>`
- **Description**: Start the login process with your KUET student email
- **Required Permission**: None (but cannot be used by verified users)
- **Allowed Channels**: Verification channel only
- **Details**: 
  - Sends a verification code to the provided KUET student email
  - Email must be in the format `username@stud.kuet.ac.bd`

#### `/auth verify <code>`
- **Description**: Verify your account using the code sent to your email
- **Required Permission**: None (but cannot be used by verified users)
- **Allowed Channels**: Verification channel and DMs
- **Details**:
  - Use the verification code sent to your email
  - Must be used in the same server where you initiated the login

#### `/auth acknowledge @user`
- **Description**: Acknowledge and verify a user (Manager only)
- **Required Permission**: Manager role
- **Allowed Channels**: Verification channel
- **Details**:
  - Can only be used by users with Manager role
  - Assigns appropriate batch role based on user's email

#### `/auth status`
- **Description**: Check your authentication status
- **Required Permission**: None
- **Details**:
  - Shows your current verification status and roles

## Permission Management

The permission system is built on a flexible role-based access control (RBAC) model with the following components:

### How It Works

1. **Permission Definition**:
   - Each command defines its permission requirements in `auth-perms.config.ts`
   - Permissions can specify allowed/forbidden roles and channels
   - Example:
     ```typescript
     login: {
       channels: { allowed: new Set([Channels.verification]) },
       roles: { forbidden: new Set([Roles.verified]) }
     }
     ```

2. **Permission Enforcement**:
   - The `PermissionGuard` validates all incoming commands
   - Checks are performed in this order:
     1. Channel permissions
     2. User block status
     3. User allow status
     4. Role block status
     5. Role allow status

3. **Decorators**:
   - `@SetPermissions()`: Applies permission rules to a command
   - `@ApplyPermissions()`: Applies permissions to all methods in a class
   - `@UseGuards(PermissionGuard)`: Enables permission checking

### Roles
- **Manager**: Can use acknowledge command
- **Verified**: Assigned after successful verification
- **Member**: Regular member role
- **Executive**: Executive member role
- **Batch Roles**: Automatically assigned based on email (e.g., 2k20, 2k21, etc.)
- **Bot**: Bot role

### Channel Permissions
- **Verification Channel**: Used for authentication commands
- **DM**: Some commands can be used in direct messages

## How to Get Verified
1. Use `/auth login your_username@stud.kuet.ac.bd` in the verification channel
2. Check your email for the verification code
3. Use `/auth verify <code>` with the code you received
4. A manager will verify your account and assign appropriate roles
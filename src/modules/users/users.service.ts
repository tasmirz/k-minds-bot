import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument, UserRole } from './user.schema'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(@InjectModel(User.name) public userModel: Model<UserDocument>) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec()
  }

  async findOneByDiscordId(discordId: bigint): Promise<User | null> {
    return this.userModel.findOne({ discordId: discordId.toString() }).exec()
  }

  async createOrUpdateDiscordUser(
    email: string,
    name: string,
    discordId: bigint,
    term?: string,
    role: UserRole = UserRole.STUDENT,
  ): Promise<User> {
    const discordIdStr = discordId.toString()
    const user = await this.userModel.findOneAndUpdate(
      { discordId: discordIdStr },
      {
        $set: {
          email: email.toLowerCase(),
          name,
          discordId: discordIdStr,
          role,
          ...(term && { term }),
        },
      },
      { new: true, upsert: true },
    )

    return user
  }

  async findByEmailPrefix(prefix: string, limit = 10): Promise<User[]> {
    const regex = new RegExp(`^${prefix}`, 'i')
    return this.userModel
      .find({ email: { $regex: regex } })
      .limit(limit)
      .exec()
  }

  async updateUserRole(
    discordId: bigint,
    role: UserRole,
  ): Promise<User | null> {
    return this.userModel
      .findOneAndUpdate(
        { discordId: discordId.toString() },
        { $set: { role } },
        { new: true },
      )
      .exec()
  }
}

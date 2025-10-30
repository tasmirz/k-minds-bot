import { UserOption } from 'necord';
import { User } from 'discord.js';

export class AcknowledgeDto {
  @UserOption({
    name: 'user',
    description: 'The user to acknowledge',
    required: true,
  })
  user: User;
}

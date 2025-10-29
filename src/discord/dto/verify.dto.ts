import { StringOption } from 'necord';

export class VerifyDto {
  @StringOption({
    name: 'code',
    description: 'The verification code sent to your email',
    required: true,
    min_length: 6,
    max_length: 6,
  })
  code: string;

  @StringOption({
    name: 'name',
    description: 'Your full name (2-50 characters)',
    required: true,
    min_length: 2,
    max_length: 50,
  })
  name: string;
}

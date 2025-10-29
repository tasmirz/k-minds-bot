import { StringOption } from 'necord';
import { IsString, IsEmail,Matches } from 'class-validator';
export class LoginDto {
  @StringOption({
    name: 'email',
    description: 'Your KUET student email prefix (e.g. zihad2107071)',
    // [a-z]{2,}[0-9]{7}@stud.kuet.ac.bd
    required: true,
    min_length: 8,
    max_length: 40,
  })
  @IsString()
  @IsEmail()
  @Matches(/^[a-z]{2,}[0-9]{7}$/)
  email: string;
}

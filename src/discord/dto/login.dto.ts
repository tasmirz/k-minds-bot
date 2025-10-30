import { StringOption } from 'necord'
import { IsString, IsEmail, Matches, MinLength, MaxLength } from 'class-validator'

export class LoginDto {
  @StringOption({
    name: 'email',
    description: 'Your KUET student email prefix (e.g. zihad2107071)',
    required: true,
    min_length: 9,
    max_length: 20,
  })
  @IsString({ message: 'Email prefix must be a string' })
  @MinLength(9, { message: 'Email prefix is too short. It should be at least 2 characters long.' })
  @MaxLength(20, { message: 'Email prefix is too long. It should be at most 20 characters.' })
  @Matches(
    /^[a-z]{2,}[0-9]{7}$/, 
    { 
      message: 'Invalid KUET student email format. It should be in the format: nameid (e.g., zihad2107071)' 
    }
  ) 
  email: string

}

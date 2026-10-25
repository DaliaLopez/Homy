import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsString()
  @MinLength(15)
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9\s-_]+$/, {
    message:
      'This field can only contain letters, numbers, spaces, and hyphens',
  })
  password!: string;
}

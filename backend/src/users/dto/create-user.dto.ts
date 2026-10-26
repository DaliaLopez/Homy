/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
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
      'The password can only contain letters, numbers, spaces, and hyphens',
  })
  password!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @IsIn(['user', 'worker', 'admin'])
  role?: string;
}

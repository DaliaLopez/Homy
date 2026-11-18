import {
  IsEmail,
  IsIn,
  IsNotEmpty,
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
  @Matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/, {
    message:
      'The password can contain letters, numbers, and special characters, but cannot contain spaces',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['user', 'worker'], {
    message: 'Role must be either user or worker',
  })
  role!: string;

  // Se agregó el numero para chatear
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+\s-]{7,20}$/, {
    message: 'The phone can only contain numbers, spaces, + and -',
  })
  @MaxLength(20)
  phone!: string;

  // La ubicación llega como "Ciudad, Departamento".
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location!: string;
}

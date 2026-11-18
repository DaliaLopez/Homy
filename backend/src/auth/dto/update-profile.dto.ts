import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Datos que cualquier usuario puede cambiar de su propia cuenta. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\s-]{7,20}$/, {
    message: 'The phone can only contain numbers, spaces, + and -',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  @Matches(/^data:image\/[\w+.-]+;base64,/, {
    message: 'avatarUrl must be an image data URL',
  })
  @MaxLength(3 * 1024 * 1024)
  avatarUrl?: string;
}

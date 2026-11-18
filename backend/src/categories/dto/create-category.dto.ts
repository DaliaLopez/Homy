import {
  Matches,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(data:image\/[\w+.-]+;base64,|https?:\/\/)/, {
    message: 'imageUrl must be an image data URL or an http(s) URL',
  })
  @MaxLength(4 * 1024 * 1024)
  imageUrl?: string;
}

import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(500)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(800)
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

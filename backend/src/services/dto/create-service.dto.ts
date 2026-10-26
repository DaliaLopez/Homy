import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(800)
  description!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price!: number;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;
}

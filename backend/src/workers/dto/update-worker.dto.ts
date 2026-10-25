import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  experience?: string;
}

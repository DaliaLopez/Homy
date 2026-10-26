import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price!: number;

  @IsUUID()
  @IsNotEmpty()
  workerId!: string;

  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;
}

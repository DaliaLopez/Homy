import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  experience!: string;
}

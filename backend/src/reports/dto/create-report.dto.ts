import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { StoredFileDto } from '../../common/stored-file';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  reason!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @IsUUID()
  @IsNotEmpty()
  reportedUserId!: string;

  @IsUUID()
  @IsNotEmpty()
  requestId!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoredFileDto)
  evidence?: StoredFileDto[];
}

export class RespondReportDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(500)
  response!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoredFileDto)
  evidence?: StoredFileDto[];
}

import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsNumber, Max, Min } from 'class-validator';
import { VerificationStatus } from '../../verifications/enums/verification-status.enum';

export class FindWorkersQueryDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

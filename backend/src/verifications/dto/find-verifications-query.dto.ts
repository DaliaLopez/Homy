import { IsEnum, IsOptional } from 'class-validator';
import { VerificationStatus } from '../enums/verification-status.enum';

export class FindVerificationsQueryDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;
}

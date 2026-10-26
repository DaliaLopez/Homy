import { IsIn } from 'class-validator';
import { VerificationStatus } from '../enums/verification-status.enum';

export class ReviewVerificationDto {
  @IsIn([VerificationStatus.VERIFIED, VerificationStatus.REJECTED])
  status!: VerificationStatus.VERIFIED | VerificationStatus.REJECTED;
}

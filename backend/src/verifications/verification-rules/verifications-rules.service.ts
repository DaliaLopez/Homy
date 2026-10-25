import { ConflictException, Injectable } from '@nestjs/common';
import { VerificationEntity } from '../entities/verification.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

@Injectable()
export class VerificationsRulesService {
  ensureCanRequest(
    workerStatus: VerificationStatus,
    hasPendingRequest: boolean,
  ): void {
    if (workerStatus === VerificationStatus.VERIFIED) {
      throw new ConflictException('The worker is already verified.');
    }

    if (hasPendingRequest) {
      throw new ConflictException(
        'There is already a pending verification request.',
      );
    }
  }

  ensureCanBeReviewed(verification: VerificationEntity): void {
    if (verification.status !== VerificationStatus.PENDING) {
      throw new ConflictException(
        `The verification was already reviewed (${verification.status}) and cannot be modified.`,
      );
    }
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { VerificationEntity } from '../entities/verification.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

const OPEN_STATUSES = [
  VerificationStatus.PENDING,
  VerificationStatus.CHANGES_REQUESTED,
];

@Injectable()
export class VerificationsRulesService {
  /**
   * Verificación inicial: solo si el trabajador no está verificado y no tiene
   * otra solicitud abierta. Nueva categoría: solo trabajadores verificados.
   */
  ensureCanRequest(
    type: 'initial' | 'category',
    workerStatus: VerificationStatus,
    open: VerificationEntity[],
    categoryIds: string[],
    approvedIds: string[],
  ): void {
    if (type === 'initial') {
      if (workerStatus === VerificationStatus.VERIFIED) {
        throw new ConflictException('The worker is already verified.');
      }
      if (open.some((item) => item.type === 'initial')) {
        throw new ConflictException(
          'There is already a pending verification request.',
        );
      }
      return;
    }

    if (workerStatus !== VerificationStatus.VERIFIED) {
      throw new ConflictException(
        'Complete your initial verification before adding categories.',
      );
    }

    for (const id of categoryIds) {
      if (approvedIds.includes(id)) {
        throw new ConflictException('That category is already verified.');
      }
      // Una categoría que el administrador no aprobó se puede volver a pedir con evidencia nueva;
      // solo bloquea la que sigue pendiente de revisión.
      const inReview = open.some((item) =>
        item.categories.some(
          (category) =>
            category.categoryId === id && category.status !== 'rejected',
        ),
      );
      if (inReview) {
        throw new ConflictException('That category is already in review.');
      }
    }
  }

  ensureRequiredDocuments(keys: string[]): void {
    for (const key of ['profile', 'id', 'selfie']) {
      if (!keys.includes(key)) {
        throw new BadRequestException(
          'The initial verification needs the profile photo, the ID and the photo with the ID.',
        );
      }
    }
  }

  ensureCanBeReviewed(verification: VerificationEntity): void {
    if (verification.status !== VerificationStatus.PENDING) {
      throw new ConflictException(
        `The verification was already reviewed (${verification.status}) and cannot be modified.`,
      );
    }
  }

  ensureCanResubmit(verification: VerificationEntity): void {
    if (verification.status !== VerificationStatus.CHANGES_REQUESTED) {
      throw new ConflictException(
        'Only verifications with requested changes can be resubmitted.',
      );
    }
  }

  isOpen(status: VerificationStatus): boolean {
    return OPEN_STATUSES.includes(status);
  }
}

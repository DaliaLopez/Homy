import { ConflictException, Injectable } from '@nestjs/common';
import { RequestEntity } from '../entities/request.entity';
import { RequestStatus } from '../enums/request-status.enum';

@Injectable()
export class RequestsRulesService {
  ensureCanBeUpdated(request: RequestEntity, newStatus: RequestStatus): void {
    const terminalStates = [
      RequestStatus.COMPLETED,
      RequestStatus.REJECTED,
      RequestStatus.CANCELLED,
      RequestStatus.EXPIRED,
    ];

    if (terminalStates.includes(request.status)) {
      throw new ConflictException(
        `The request is already in state '${request.status}' and cannot be modified.`,
      );
    }

    if (
      newStatus === RequestStatus.COMPLETED &&
      request.status !== RequestStatus.IN_PROGRESS
    ) {
      throw new ConflictException(
        'The request must be "in progress" before it can be marked as "completed".',
      );
    }

    if (
      newStatus === RequestStatus.IN_PROGRESS &&
      request.status !== RequestStatus.ACCEPTED
    ) {
      throw new ConflictException(
        'The request must be "accepted" before it can be marked as "in progress".',
      );
    }
  }
}

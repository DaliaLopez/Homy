import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RequestEntity } from '../entities/request.entity';
import { RequestStatus } from '../enums/request-status.enum';

export type RequestActor = 'client' | 'worker';

const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.REQUESTED]: [
    RequestStatus.ACCEPTED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.ACCEPTED]: [
    RequestStatus.IN_PROGRESS,
    RequestStatus.CANCELLED,
    RequestStatus.EXPIRED,
  ],
  [RequestStatus.IN_PROGRESS]: [RequestStatus.COMPLETED],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.REJECTED]: [],
  [RequestStatus.CANCELLED]: [],
  [RequestStatus.EXPIRED]: [],
};

const ACTOR_PERMISSIONS: Record<RequestActor, RequestStatus[]> = {
  client: [RequestStatus.CANCELLED],
  worker: [
    RequestStatus.ACCEPTED,
    RequestStatus.REJECTED,
    RequestStatus.IN_PROGRESS,
    RequestStatus.COMPLETED,
    RequestStatus.CANCELLED,
  ],
};

@Injectable()
export class RequestsRulesService {
  ensureCanBeCreated(params: {
    clientId: string;
    workerUserId: string;
    requestedWorkerId: string;
    serviceWorkerId: string;
    serviceIsActive: boolean;
    scheduledAt: Date;
  }): void {
    if (
      Number.isNaN(params.scheduledAt.getTime()) ||
      params.scheduledAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('The scheduled date must be in the future.');
    }

    if (params.clientId === params.workerUserId) {
      throw new ConflictException('You cannot request your own service.');
    }

    if (params.serviceWorkerId !== params.requestedWorkerId) {
      throw new ConflictException(
        'The selected service does not belong to the requested worker.',
      );
    }

    if (!params.serviceIsActive) {
      throw new ConflictException('The selected service is not active.');
    }
  }

  ensureCanBeUpdated(request: RequestEntity, newStatus: RequestStatus): void {
    const allowed = ALLOWED_TRANSITIONS[request.status];

    if (allowed.length === 0) {
      throw new ConflictException(
        `The request is already in state '${request.status}' and cannot be modified.`,
      );
    }

    if (!allowed.includes(newStatus)) {
      throw new ConflictException(
        `The request cannot change from '${request.status}' to '${newStatus}'.`,
      );
    }
  }

  ensureActorCanSetStatus(newStatus: RequestStatus, actor: RequestActor): void {
    if (!ACTOR_PERMISSIONS[actor].includes(newStatus)) {
      throw new ForbiddenException(
        `A ${actor} is not allowed to set the request to '${newStatus}'.`,
      );
    }
  }
}
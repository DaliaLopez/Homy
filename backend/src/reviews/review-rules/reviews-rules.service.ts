import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RequestEntity } from '../../requests/entities/request.entity';
import { RequestStatus } from '../../requests/enums/request-status.enum';

@Injectable()
export class ReviewsRulesService {
  ensureCanBeReviewed(request: RequestEntity, userId: string): void {
    if (request.client.id !== userId) {
      throw new ForbiddenException(
        'Only the client who made the request can review it.',
      );
    }

    if (request.status !== RequestStatus.COMPLETED) {
      throw new ConflictException('Only completed services can be reviewed.');
    }
  }

  ensureNotAlreadyReviewed(alreadyReviewed: boolean): void {
    if (alreadyReviewed) {
      throw new ConflictException('This service has already been reviewed.');
    }
  }
}

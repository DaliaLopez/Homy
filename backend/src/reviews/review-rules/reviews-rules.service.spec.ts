import { describe, beforeEach, it, expect } from '@jest/globals';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewsRulesService } from './reviews-rules.service';
import { RequestEntity } from '../../requests/entities/request.entity';
import { RequestStatus } from '../../requests/enums/request-status.enum';

describe('ReviewsRulesServiceTest', () => {
  let rulesService: ReviewsRulesService;

  const buildRequest = (status: RequestStatus) =>
    ({ status, client: { id: 'user-1' } }) as unknown as RequestEntity;

  beforeEach(() => {
    rulesService = new ReviewsRulesService();
  });

  it('allows reviewing a completed request made by the same client', () => {
    const request = buildRequest(RequestStatus.COMPLETED);

    expect(() =>
      rulesService.ensureCanBeReviewed(request, 'user-1'),
    ).not.toThrow();
  });

  it('throws ForbiddenException when the user is not the client of the request', () => {
    const request = buildRequest(RequestStatus.COMPLETED);

    expect(() => rulesService.ensureCanBeReviewed(request, 'user-2')).toThrow(
      ForbiddenException,
    );
  });

  it('throws ConflictException when the request is not completed yet', () => {
    const request = buildRequest(RequestStatus.IN_PROGRESS);

    expect(() => rulesService.ensureCanBeReviewed(request, 'user-1')).toThrow(
      ConflictException,
    );
  });

  it('throws ConflictException when the request was cancelled', () => {
    const request = buildRequest(RequestStatus.CANCELLED);

    expect(() => rulesService.ensureCanBeReviewed(request, 'user-1')).toThrow(
      ConflictException,
    );
  });

  it('allows the first review of a request', () => {
    expect(() => rulesService.ensureNotAlreadyReviewed(false)).not.toThrow();
  });

  it('throws ConflictException when the request was already reviewed', () => {
    expect(() => rulesService.ensureNotAlreadyReviewed(true)).toThrow(
      ConflictException,
    );
  });
});

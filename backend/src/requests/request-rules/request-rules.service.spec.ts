import { describe, beforeEach, it, expect } from '@jest/globals';
import { RequestsRulesService } from './request-rules.service';
import { RequestEntity } from '../entities/request.entity';
import { RequestStatus } from '../enums/request-status.enum';
import { ConflictException } from '@nestjs/common';

describe('RequestsRulesServiceTest', () => {
  let rulesService: RequestsRulesService;

  beforeEach(() => {
    rulesService = new RequestsRulesService();
  });

  it('allows transition from REQUESTED to ACCEPTED', () => {
    const request = { status: RequestStatus.REQUESTED } as RequestEntity;

    expect(() =>
      rulesService.ensureCanBeUpdated(request, RequestStatus.ACCEPTED),
    ).not.toThrow();
  });

  it('throws ConflictException if the request is in a terminal state (EXPIRED)', () => {
    const request = { status: RequestStatus.EXPIRED } as RequestEntity;

    expect(() =>
      rulesService.ensureCanBeUpdated(request, RequestStatus.ACCEPTED),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException if trying to jump directly to COMPLETED from REQUESTED', () => {
    const request = { status: RequestStatus.REQUESTED } as RequestEntity;

    expect(() =>
      rulesService.ensureCanBeUpdated(request, RequestStatus.COMPLETED),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException if trying to jump to IN_PROGRESS without being ACCEPTED', () => {
    const request = { status: RequestStatus.REQUESTED } as RequestEntity;

    expect(() =>
      rulesService.ensureCanBeUpdated(request, RequestStatus.IN_PROGRESS),
    ).toThrow(ConflictException);
  });

  it('allows transition from IN_PROGRESS to COMPLETED', () => {
    const request = { status: RequestStatus.IN_PROGRESS } as RequestEntity;

    expect(() =>
      rulesService.ensureCanBeUpdated(request, RequestStatus.COMPLETED),
    ).not.toThrow();
  });
});

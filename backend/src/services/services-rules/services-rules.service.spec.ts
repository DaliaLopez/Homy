import { describe, beforeEach, it, expect } from '@jest/globals';
import { ConflictException, ForbiddenException } from '@nestjs/common';

import { ServiceEntity } from '../entities/service.entity';
import { RequestStatus } from '../../requests/enums/request-status.enum';
import { ServicesRulesService } from './services-rules.service';

describe('ServicesRulesServiceTest', () => {
  let rulesService: ServicesRulesService;

  beforeEach(() => {
    rulesService = new ServicesRulesService();
  });

  it('allows a worker to modify their own service', () => {
    const serviceMock = {
      worker: { id: 'worker-123' },
    } as ServiceEntity;

    expect(() =>
      rulesService.ensureCanBeModified(serviceMock, 'worker-123'),
    ).not.toThrow();
  });

  it('throws ForbiddenException if a worker modifies another worker service', () => {
    const serviceMock = {
      worker: { id: 'worker-123' },
    } as ServiceEntity;

    expect(() =>
      rulesService.ensureCanBeModified(serviceMock, 'worker-456'),
    ).toThrow(ForbiddenException);
  });

  it('allows modification when there are no active requests', () => {
    expect(() =>
      rulesService.ensureHasNoActiveRequests([
        RequestStatus.COMPLETED,
        RequestStatus.CANCELLED,
      ]),
    ).not.toThrow();
  });

  it('throws ConflictException when a service has a requested request', () => {
    expect(() =>
      rulesService.ensureHasNoActiveRequests([RequestStatus.REQUESTED]),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException when a service has an accepted request', () => {
    expect(() =>
      rulesService.ensureHasNoActiveRequests([RequestStatus.ACCEPTED]),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException when a service has an in-progress request', () => {
    expect(() =>
      rulesService.ensureHasNoActiveRequests([RequestStatus.IN_PROGRESS]),
    ).toThrow(ConflictException);
  });
});

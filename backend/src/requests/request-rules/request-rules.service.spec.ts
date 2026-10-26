import { describe, beforeEach, it, expect } from '@jest/globals';
import { RequestsRulesService } from './request-rules.service';
import { RequestEntity } from '../entities/request.entity';
import { RequestStatus } from '../enums/request-status.enum';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('RequestsRulesServiceTest', () => {
  let rulesService: RequestsRulesService;

  const buildRequest = (status: RequestStatus) =>
    ({ status }) as RequestEntity;

  const validCreation = () => ({
    clientId: 'user-client',
    workerUserId: 'user-worker',
    requestedWorkerId: 'worker-1',
    serviceWorkerId: 'worker-1',
    serviceIsActive: true,
    scheduledAt: new Date(Date.now() + 86_400_000),
  });

  beforeEach(() => {
    rulesService = new RequestsRulesService();
  });

  it('allows transition from REQUESTED to ACCEPTED', () => {
    expect(() =>
      rulesService.ensureCanBeUpdated(
        buildRequest(RequestStatus.REQUESTED),
        RequestStatus.ACCEPTED,
      ),
    ).not.toThrow();
  });

  it('throws ConflictException if the request is in a terminal state (EXPIRED)', () => {
    expect(() =>
      rulesService.ensureCanBeUpdated(
        buildRequest(RequestStatus.EXPIRED),
        RequestStatus.ACCEPTED,
      ),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException if trying to jump directly to COMPLETED from REQUESTED', () => {
    expect(() =>
      rulesService.ensureCanBeUpdated(
        buildRequest(RequestStatus.REQUESTED),
        RequestStatus.COMPLETED,
      ),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException if trying to jump to IN_PROGRESS without being ACCEPTED', () => {
    expect(() =>
      rulesService.ensureCanBeUpdated(
        buildRequest(RequestStatus.REQUESTED),
        RequestStatus.IN_PROGRESS,
      ),
    ).toThrow(ConflictException);
  });

  it('allows transition from IN_PROGRESS to COMPLETED', () => {
    expect(() =>
      rulesService.ensureCanBeUpdated(
        buildRequest(RequestStatus.IN_PROGRESS),
        RequestStatus.COMPLETED,
      ),
    ).not.toThrow();
  });

  it('does not allow cancelling a request that is in progress', () => {
    expect(() =>
      rulesService.ensureCanBeUpdated(
        buildRequest(RequestStatus.IN_PROGRESS),
        RequestStatus.CANCELLED,
      ),
    ).toThrow(ConflictException);
  });

  it('lets the client only cancel', () => {
    expect(() =>
      rulesService.ensureActorCanSetStatus(RequestStatus.CANCELLED, 'client'),
    ).not.toThrow();
    expect(() =>
      rulesService.ensureActorCanSetStatus(RequestStatus.ACCEPTED, 'client'),
    ).toThrow(ForbiddenException);
  });

  it('lets the worker accept but not expire a request', () => {
    expect(() =>
      rulesService.ensureActorCanSetStatus(RequestStatus.ACCEPTED, 'worker'),
    ).not.toThrow();
    expect(() =>
      rulesService.ensureActorCanSetStatus(RequestStatus.EXPIRED, 'worker'),
    ).toThrow(ForbiddenException);
  });

  it('allows creating a valid request', () => {
    expect(() =>
      rulesService.ensureCanBeCreated(validCreation()),
    ).not.toThrow();
  });

  it('rejects a past scheduled date', () => {
    expect(() =>
      rulesService.ensureCanBeCreated({
        ...validCreation(),
        scheduledAt: new Date(Date.now() - 1000),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects requesting your own service', () => {
    expect(() =>
      rulesService.ensureCanBeCreated({
        ...validCreation(),
        workerUserId: 'user-client',
      }),
    ).toThrow(ConflictException);
  });

  it('rejects a service that belongs to another worker', () => {
    expect(() =>
      rulesService.ensureCanBeCreated({
        ...validCreation(),
        serviceWorkerId: 'worker-2',
      }),
    ).toThrow(ConflictException);
  });

  it('rejects an inactive service', () => {
    expect(() =>
      rulesService.ensureCanBeCreated({
        ...validCreation(),
        serviceIsActive: false,
      }),
    ).toThrow(ConflictException);
  });
});
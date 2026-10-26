import { describe, beforeEach, it, expect } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { VerificationsRulesService } from './verifications-rules.service';
import { VerificationEntity } from '../entities/verification.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

describe('VerificationsRulesServiceTest', () => {
  let rulesService: VerificationsRulesService;

  beforeEach(() => {
    rulesService = new VerificationsRulesService();
  });

  it('allows requesting verification when the worker is pending and has no open request', () => {
    expect(() =>
      rulesService.ensureCanRequest(VerificationStatus.PENDING, false),
    ).not.toThrow();
  });

  it('allows requesting verification again after being rejected', () => {
    expect(() =>
      rulesService.ensureCanRequest(VerificationStatus.REJECTED, false),
    ).not.toThrow();
  });

  it('throws ConflictException when the worker is already verified', () => {
    expect(() =>
      rulesService.ensureCanRequest(VerificationStatus.VERIFIED, false),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException when there is already a pending request', () => {
    expect(() =>
      rulesService.ensureCanRequest(VerificationStatus.PENDING, true),
    ).toThrow(ConflictException);
  });

  it('allows reviewing a pending verification', () => {
    const verification = {
      status: VerificationStatus.PENDING,
    } as VerificationEntity;

    expect(() => rulesService.ensureCanBeReviewed(verification)).not.toThrow();
  });

  it('throws ConflictException when the verification was already approved', () => {
    const verification = {
      status: VerificationStatus.VERIFIED,
    } as VerificationEntity;

    expect(() => rulesService.ensureCanBeReviewed(verification)).toThrow(
      ConflictException,
    );
  });

  it('throws ConflictException when the verification was already rejected', () => {
    const verification = {
      status: VerificationStatus.REJECTED,
    } as VerificationEntity;

    expect(() => rulesService.ensureCanBeReviewed(verification)).toThrow(
      ConflictException,
    );
  });
});

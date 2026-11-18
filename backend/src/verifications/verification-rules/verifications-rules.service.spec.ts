import { describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { VerificationsRulesService } from './verifications-rules.service';
import { VerificationEntity } from '../entities/verification.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

const open = (type: 'initial' | 'category', categoryIds: string[] = []) =>
  ({
    type,
    status: VerificationStatus.PENDING,
    categories: categoryIds.map((categoryId) => ({ categoryId })),
  }) as unknown as VerificationEntity;

describe('VerificationsRulesServiceTest', () => {
  let rules: VerificationsRulesService;

  beforeEach(() => {
    rules = new VerificationsRulesService();
  });

  it('allows the initial verification when the worker is not verified and has nothing open', () => {
    expect(() =>
      rules.ensureCanRequest(
        'initial',
        VerificationStatus.PENDING,
        [],
        ['c1'],
        [],
      ),
    ).not.toThrow();
  });

  it('allows the initial verification again after it was rejected', () => {
    expect(() =>
      rules.ensureCanRequest(
        'initial',
        VerificationStatus.REJECTED,
        [],
        ['c1'],
        [],
      ),
    ).not.toThrow();
  });

  it('throws ConflictException when the worker is already verified', () => {
    expect(() =>
      rules.ensureCanRequest(
        'initial',
        VerificationStatus.VERIFIED,
        [],
        ['c1'],
        [],
      ),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException when there is already an open initial verification', () => {
    expect(() =>
      rules.ensureCanRequest(
        'initial',
        VerificationStatus.PENDING,
        [open('initial')],
        ['c1'],
        [],
      ),
    ).toThrow(ConflictException);
  });

  it('only lets verified workers add a new category', () => {
    expect(() =>
      rules.ensureCanRequest(
        'category',
        VerificationStatus.PENDING,
        [],
        ['c2'],
        [],
      ),
    ).toThrow(ConflictException);
    expect(() =>
      rules.ensureCanRequest(
        'category',
        VerificationStatus.VERIFIED,
        [],
        ['c2'],
        ['c1'],
      ),
    ).not.toThrow();
  });

  it('lets the worker request again a category the admin did not approve', () => {
    const changes = {
      type: 'category',
      status: VerificationStatus.CHANGES_REQUESTED,
      categories: [{ categoryId: 'c2', status: 'rejected' }],
    } as unknown as VerificationEntity;
    expect(() =>
      rules.ensureCanRequest(
        'category',
        VerificationStatus.VERIFIED,
        [changes],
        ['c2'],
        ['c1'],
      ),
    ).not.toThrow();
  });

  it('rejects a category that is already verified or in review', () => {
    expect(() =>
      rules.ensureCanRequest(
        'category',
        VerificationStatus.VERIFIED,
        [],
        ['c1'],
        ['c1'],
      ),
    ).toThrow(ConflictException);
    expect(() =>
      rules.ensureCanRequest(
        'category',
        VerificationStatus.VERIFIED,
        [open('category', ['c2'])],
        ['c2'],
        [],
      ),
    ).toThrow(ConflictException);
  });

  it('requires the three general documents', () => {
    expect(() => rules.ensureRequiredDocuments(['profile', 'id'])).toThrow(
      BadRequestException,
    );
    expect(() =>
      rules.ensureRequiredDocuments(['profile', 'id', 'selfie']),
    ).not.toThrow();
  });

  it('only reviews pending verifications', () => {
    expect(() =>
      rules.ensureCanBeReviewed({
        status: VerificationStatus.PENDING,
      } as VerificationEntity),
    ).not.toThrow();
    expect(() =>
      rules.ensureCanBeReviewed({
        status: VerificationStatus.VERIFIED,
      } as VerificationEntity),
    ).toThrow(ConflictException);
  });

  it('only resubmits verifications with requested changes', () => {
    expect(() =>
      rules.ensureCanResubmit({
        status: VerificationStatus.CHANGES_REQUESTED,
      } as VerificationEntity),
    ).not.toThrow();
    expect(() =>
      rules.ensureCanResubmit({
        status: VerificationStatus.PENDING,
      } as VerificationEntity),
    ).toThrow(ConflictException);
  });
});

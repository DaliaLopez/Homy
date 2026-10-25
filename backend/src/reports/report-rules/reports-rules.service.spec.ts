import { describe, beforeEach, it, expect } from '@jest/globals';
import { ReportsRulesService } from './reports-rules.service';
import { ReportEntity } from '../entities/report.entity';
import { ReportStatus } from '../enums/report-status.enum';
import { ConflictException } from '@nestjs/common';

describe('ReportsRulesServiceTest', () => {
  let rulesService: ReportsRulesService;

  beforeEach(() => {
    rulesService = new ReportsRulesService();
  });

  it('allows transition from PENDING to INVESTIGATING', () => {
    const report = { status: ReportStatus.PENDING } as ReportEntity;
    expect(() =>
      rulesService.ensureCanBeUpdated(report, ReportStatus.INVESTIGATING),
    ).not.toThrow();
  });

  it('throws ConflictException if the report is in a terminal state (RESOLVED)', () => {
    const report = { status: ReportStatus.RESOLVED } as ReportEntity;
    expect(() =>
      rulesService.ensureCanBeUpdated(report, ReportStatus.INVESTIGATING),
    ).toThrow(ConflictException);
  });

  it('throws ConflictException if trying to jump directly to RESOLVED from PENDING', () => {
    const report = { status: ReportStatus.PENDING } as ReportEntity;
    expect(() =>
      rulesService.ensureCanBeUpdated(report, ReportStatus.RESOLVED),
    ).toThrow(ConflictException);
  });

  it('allows transition from INVESTIGATING to RESOLVED', () => {
    const report = { status: ReportStatus.INVESTIGATING } as ReportEntity;
    expect(() =>
      rulesService.ensureCanBeUpdated(report, ReportStatus.RESOLVED),
    ).not.toThrow();
  });
});

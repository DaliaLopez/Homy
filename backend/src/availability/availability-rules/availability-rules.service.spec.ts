import { ConflictException } from '@nestjs/common';
import { AvailabilityRulesService } from './availability-rules.service';
import { AvailabilityEntity } from '../entities/availability.entity';
import { describe, beforeEach, it, expect } from '@jest/globals';

describe('AvailabilityRulesService', () => {
  let service: AvailabilityRulesService;

  beforeEach(() => {
    service = new AvailabilityRulesService();
  });

  describe('ensureValidTimeRange', () => {
    it('should not throw when the end time is later than the start time', () => {
      expect(() =>
        service.ensureValidTimeRange('09:00:00', '10:00:00'),
      ).not.toThrow();
    });

    it('should throw ConflictException when start and end times are equal', () => {
      expect(() =>
        service.ensureValidTimeRange('09:00:00', '09:00:00'),
      ).toThrow(ConflictException);
    });

    it('should throw ConflictException when the end time is earlier than the start time', () => {
      expect(() =>
        service.ensureValidTimeRange('10:00:00', '09:00:00'),
      ).toThrow(ConflictException);
    });
  });

  describe('ensureNoOverlap', () => {
    const existingAvailabilities = [
      {
        id: 'availability-1',
        startTime: '09:00:00',
        endTime: '11:00:00',
      },
    ] as AvailabilityEntity[];

    it('should not throw when there are no existing availabilities', () => {
      expect(() =>
        service.ensureNoOverlap('09:00:00', '11:00:00', []),
      ).not.toThrow();
    });

    it('should throw ConflictException when availabilities overlap', () => {
      expect(() =>
        service.ensureNoOverlap('10:00:00', '12:00:00', existingAvailabilities),
      ).toThrow(ConflictException);
    });

    it('should not throw when availabilities do not overlap', () => {
      expect(() =>
        service.ensureNoOverlap('11:00:00', '12:00:00', existingAvailabilities),
      ).not.toThrow();
    });

    it('should ignore the availability with the excluded ID', () => {
      expect(() =>
        service.ensureNoOverlap(
          '09:30:00',
          '10:30:00',
          existingAvailabilities,
          'availability-1',
        ),
      ).not.toThrow();
    });

    it('should allow availabilities that only touch at the boundary', () => {
      expect(() =>
        service.ensureNoOverlap('11:00:00', '12:00:00', existingAvailabilities),
      ).not.toThrow();
    });
  });

  describe('ensureHasNoRequests', () => {
    it('should not throw when there are no active requests', () => {
      expect(() => service.ensureHasNoRequests(false)).not.toThrow();
    });

    it('should throw ConflictException when active requests exist', () => {
      expect(() => service.ensureHasNoRequests(true)).toThrow(
        ConflictException,
      );
    });
  });

  describe('ensureRequestFitsTimeRange', () => {
    it('should not throw when the entire request fits within availability', () => {
      expect(() =>
        service.ensureRequestFitsTimeRange(
          9 * 3600,
          10 * 3600,
          8 * 3600,
          12 * 3600,
        ),
      ).not.toThrow();
    });

    it('should throw ConflictException when the request starts before availability', () => {
      expect(() =>
        service.ensureRequestFitsTimeRange(
          7 * 3600,
          9 * 3600,
          8 * 3600,
          12 * 3600,
        ),
      ).toThrow(ConflictException);
    });

    it('should throw ConflictException when the request ends after availability', () => {
      expect(() =>
        service.ensureRequestFitsTimeRange(
          11 * 3600,
          13 * 3600,
          8 * 3600,
          12 * 3600,
        ),
      ).toThrow(ConflictException);
    });

    it('should allow a request that exactly matches the availability boundaries', () => {
      expect(() =>
        service.ensureRequestFitsTimeRange(
          8 * 3600,
          12 * 3600,
          8 * 3600,
          12 * 3600,
        ),
      ).not.toThrow();
    });
  });
});

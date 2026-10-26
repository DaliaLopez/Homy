import { ConflictException, Injectable } from '@nestjs/common';

import { AvailabilityEntity } from '../entities/availability.entity';

@Injectable()
export class AvailabilityRulesService {
  private timeToSeconds(time: string): number {
    const [hours, minutes, seconds = '0'] = time.split(':');

    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }

  ensureValidTimeRange(startTime: string, endTime: string): void {
    if (this.timeToSeconds(startTime) >= this.timeToSeconds(endTime)) {
      throw new ConflictException(
        'The end time must be later than the start time.',
      );
    }
  }

  ensureNoOverlap(
    startTime: string,
    endTime: string,
    existingAvailabilities: AvailabilityEntity[],
    excludeAvailabilityId?: string,
  ): void {
    const newStart = this.timeToSeconds(startTime);
    const newEnd = this.timeToSeconds(endTime);

    const hasOverlap = existingAvailabilities.some((availability) => {
      if (availability.id === excludeAvailabilityId) {
        return false;
      }

      const existingStart = this.timeToSeconds(availability.startTime);
      const existingEnd = this.timeToSeconds(availability.endTime);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (hasOverlap) {
      throw new ConflictException(
        'This availability overlaps with another availability on the same day.',
      );
    }
  }

  ensureHasNoRequests(hasRequests: boolean): void {
    if (hasRequests) {
      throw new ConflictException(
        'This availability cannot be changed because active service requests are scheduled in this time slot.',
      );
    }
  }

  ensureRequestFitsTimeRange(
    requestStart: number,
    requestEnd: number,
    availabilityStart: number,
    availabilityEnd: number,
  ): void {
    if (requestStart < availabilityStart || requestEnd > availabilityEnd) {
      throw new ConflictException(
        'The request does not fit within the worker availability.',
      );
    }
  }
}

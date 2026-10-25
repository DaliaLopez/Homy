import { describe, beforeEach, it, expect } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { WorkersRulesService } from './workers-rules.service';
import { WorkerEntity } from '../entities/worker.entity';

describe('WorkersRulesServiceTest', () => {
  let rulesService: WorkersRulesService;

  beforeEach(() => {
    rulesService = new WorkersRulesService();
  });

  it('allows creating a profile when the user does not have one', () => {
    expect(() => rulesService.ensureProfileDoesNotExist(null)).not.toThrow();
  });

  it('throws ConflictException when the user already has a profile', () => {
    const existing = { id: 'worker-1' } as WorkerEntity;

    expect(() => rulesService.ensureProfileDoesNotExist(existing)).toThrow(
      ConflictException,
    );
  });
});

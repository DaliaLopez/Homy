import { ConflictException } from '@nestjs/common';
import { WorkerEntity } from '../entities/worker.entity';
import { WorkersRulesService } from './workers-rules.service';
import { describe, it, expect } from '@jest/globals';

describe('WorkersRulesService', () => {
  const rules = new WorkersRulesService();

  it('permite crear el perfil si el usuario no tiene uno', () => {
    expect(() => rules.ensureProfileDoesNotExist(null)).not.toThrow();
  });

  it('lanza ConflictException si el usuario ya tiene perfil', () => {
    expect(() =>
      rules.ensureProfileDoesNotExist({ id: 'w1' } as WorkerEntity),
    ).toThrow(ConflictException);
  });
});

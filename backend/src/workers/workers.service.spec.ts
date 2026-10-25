import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { VerificationStatus } from '../verifications/enums/verification-status.enum';
import { WorkerEntity } from './entities/worker.entity';
import { WorkersRulesService } from './worker-rules/workers-rules.service';
import { WorkersService } from './workers.service';
import { describe, beforeEach, jest, it, expect } from '@jest/globals';

describe('WorkersService', () => {
  let service: WorkersService;
  const workersRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const usersRepo = { update: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkersService,
        WorkersRulesService,
        { provide: getRepositoryToken(WorkerEntity), useValue: workersRepo },
        { provide: getRepositoryToken(UserEntity), useValue: usersRepo },
      ],
    }).compile();
    service = module.get(WorkersService);
  });

  it('crea el perfil y convierte al usuario en trabajador', async () => {
    workersRepo.findOne.mockResolvedValue(null);
    workersRepo.create.mockImplementation((x) => x);
    workersRepo.save.mockImplementation((x) =>
      Promise.resolve({ id: 'w1', ...x }),
    );

    const result = await service.create('u1', {
      description: 'Plomero con años de experiencia',
      experience: '10 años en obra',
    });

    expect(result.id).toBe('w1');
    expect(usersRepo.update).toHaveBeenCalledWith(
      { id: 'u1', role: 'user' },
      { role: 'worker' },
    );
  });

  it('no crea un segundo perfil para el mismo usuario', async () => {
    workersRepo.findOne.mockResolvedValue({ id: 'w1' });

    await expect(
      service.create('u1', {
        description: 'x'.repeat(10),
        experience: 'y'.repeat(10),
      }),
    ).rejects.toThrow(ConflictException);
    expect(workersRepo.save).not.toHaveBeenCalled();
  });

  it('findOne lanza NotFoundException si el perfil no existe', async () => {
    workersRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('w404')).rejects.toThrow(NotFoundException);
  });

  it('updateMine solo cambia los campos enviados', async () => {
    const worker = {
      id: 'w1',
      description: 'vieja descripción',
      experience: 'vieja experiencia',
    };
    workersRepo.findOne.mockResolvedValue(worker);
    workersRepo.save.mockImplementation((x) => Promise.resolve(x));

    const result = await service.updateMine('u1', {
      description: 'nueva descripción larga',
    });

    expect(result.description).toBe('nueva descripción larga');
    expect(result.experience).toBe('vieja experiencia');
  });

  it('findAll filtra por calificación mínima y estado de verificación', async () => {
    workersRepo.find.mockResolvedValue([]);

    await service.findAll({
      minRating: 4,
      verificationStatus: VerificationStatus.VERIFIED,
    });

    const options = workersRepo.find.mock.calls[0][0];
    expect(options.where.verificationStatus).toBe(VerificationStatus.VERIFIED);
    expect(options.where.averageRating).toBeDefined();
    expect(options.take).toBe(50);
  });

  it('setVerificationStatus actualiza el perfil existente', async () => {
    workersRepo.findOne.mockResolvedValue({ id: 'w1' });
    await service.setVerificationStatus('w1', VerificationStatus.VERIFIED);
    expect(workersRepo.update).toHaveBeenCalledWith(
      { id: 'w1' },
      { verificationStatus: VerificationStatus.VERIFIED },
    );
  });
});

import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoreThanOrEqual } from 'typeorm';
import { WorkersService } from './workers.service';
import { WorkerEntity } from './entities/worker.entity';
import { WorkersRulesService } from './worker-rules/workers-rules.service';
import { UserEntity } from '../users/entities/user.entity';
import { VerificationStatus } from '../verifications/enums/verification-status.enum';

describe('WorkersServiceTest', () => {
  let service: WorkersService;

  const workersRepositoryMock = {
    find: jest.fn<(options: any) => Promise<WorkerEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<WorkerEntity | null>>(),
    create: jest.fn<(worker: any) => WorkerEntity>(),
    save: jest.fn<(worker: WorkerEntity) => Promise<WorkerEntity>>(),
    update: jest.fn<(criteria: any, changes: any) => Promise<unknown>>(),
  };

  const usersRepositoryMock = {
    update: jest.fn<(criteria: any, changes: any) => Promise<unknown>>(),
  };

  const workersRulesServiceMock = {
    ensureProfileDoesNotExist: jest.fn(),
  };

  const dto = {
    description: 'Plomero con experiencia en hogares',
    experience: 'Diez años trabajando en obras residenciales',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkersService,
        {
          provide: getRepositoryToken(WorkerEntity),
          useValue: workersRepositoryMock,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepositoryMock,
        },
        {
          provide: WorkersRulesService,
          useValue: workersRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(WorkersService);
  });

  it('creates the profile and turns the user into a worker', async () => {
    const createdWorker = { ...dto } as WorkerEntity;
    const savedWorker = { ...createdWorker, id: 'worker-1' };

    workersRepositoryMock.findOne.mockResolvedValue(null);
    workersRepositoryMock.create.mockReturnValue(createdWorker);
    workersRepositoryMock.save.mockResolvedValue(savedWorker);

    const result = await service.create('user-1', dto);

    expect(
      workersRulesServiceMock.ensureProfileDoesNotExist,
    ).toHaveBeenCalledWith(null);
    expect(workersRepositoryMock.create).toHaveBeenCalledWith({
      ...dto,
      user: { id: 'user-1' },
    });
    expect(workersRepositoryMock.save).toHaveBeenCalledWith(createdWorker);
    expect(usersRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'user-1', role: 'user' },
      { role: 'worker' },
    );
    expect(result.id).toEqual('worker-1');
  });

  it('does not save anything when the user already has a profile', async () => {
    workersRepositoryMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    workersRulesServiceMock.ensureProfileDoesNotExist.mockImplementationOnce(
      () => {
        throw new ConflictException();
      },
    );

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(workersRepositoryMock.save).not.toHaveBeenCalled();
    expect(usersRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('returns a worker when the id exists', async () => {
    const workerMock = { id: 'worker-1', ...dto } as WorkerEntity;
    workersRepositoryMock.findOne.mockResolvedValue(workerMock);

    const result = await service.findOne('worker-1');

    expect(result).toEqual(workerMock);
    expect(workersRepositoryMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'worker-1' } }),
    );
  });

  it('throws NotFoundException when the worker does not exist', async () => {
    workersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('worker-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns the profile of the authenticated user', async () => {
    const workerMock = { id: 'worker-1', ...dto } as WorkerEntity;
    workersRepositoryMock.findOne.mockResolvedValue(workerMock);

    const result = await service.findMine('user-1');

    expect(result).toEqual(workerMock);
    expect(workersRepositoryMock.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user: { id: 'user-1' } } }),
    );
  });

  it('throws NotFoundException when the user has no profile yet', async () => {
    workersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findMine('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates only the fields that were sent', async () => {
    const workerMock = { id: 'worker-1', ...dto } as WorkerEntity;
    workersRepositoryMock.findOne.mockResolvedValue(workerMock);
    workersRepositoryMock.save.mockImplementation((worker) =>
      Promise.resolve(worker),
    );

    const result = await service.updateMine('user-1', {
      description: 'Nueva descripción del perfil',
    });

    expect(result.description).toEqual('Nueva descripción del perfil');
    expect(result.experience).toEqual(dto.experience);
  });

  it('filters workers by rating and verification status', async () => {
    workersRepositoryMock.find.mockResolvedValue([]);

    await service.findAll({
      minRating: 4,
      verificationStatus: VerificationStatus.VERIFIED,
    });

    expect(workersRepositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          verificationStatus: VerificationStatus.VERIFIED,
          averageRating: MoreThanOrEqual(4),
        },
        take: 50,
      }),
    );
  });

  it('respects the limit sent in the query', async () => {
    workersRepositoryMock.find.mockResolvedValue([]);

    await service.findAll({ limit: 10 });

    expect(workersRepositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, take: 10 }),
    );
  });

  it('updates the verification status of an existing profile', async () => {
    workersRepositoryMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);

    await service.setVerificationStatus(
      'worker-1',
      VerificationStatus.VERIFIED,
    );

    expect(workersRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'worker-1' },
      { verificationStatus: VerificationStatus.VERIFIED },
    );
  });

  it('does not update the verification status of a missing profile', async () => {
    workersRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.setVerificationStatus('worker-1', VerificationStatus.VERIFIED),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(workersRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('updates the average rating', async () => {
    await service.updateAverageRating('worker-1', 4.5);

    expect(workersRepositoryMock.update).toHaveBeenCalledWith(
      { id: 'worker-1' },
      { averageRating: 4.5 },
    );
  });
});

import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationsService } from './verifications.service';
import { VerificationEntity } from './entities/verification.entity';
import { VerificationStatus } from './enums/verification-status.enum';
import { VerificationsRulesService } from './verification-rules/verifications-rules.service';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { WorkersService } from '../workers/workers.service';

describe('VerificationsServiceTest', () => {
  let service: VerificationsService;

  const repositoryMock = {
    find: jest.fn<(options: any) => Promise<VerificationEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<VerificationEntity | null>>(),
    exists: jest.fn<(options: any) => Promise<boolean>>(),
    create: jest.fn<(verification: any) => VerificationEntity>(),
    save: jest.fn<
      (verification: VerificationEntity) => Promise<VerificationEntity>
    >(),
  };

  const workersServiceMock = {
    findMine: jest.fn<(userId: string) => Promise<WorkerEntity>>(),
    setVerificationStatus:
      jest.fn<
        (workerId: string, status: VerificationStatus) => Promise<void>
      >(),
  };

  const verificationsRulesServiceMock = {
    ensureCanRequest: jest.fn(),
    ensureCanBeReviewed: jest.fn(),
  };

  const workerMock = {
    id: 'worker-1',
    verificationStatus: VerificationStatus.PENDING,
  } as WorkerEntity;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        VerificationsService,
        {
          provide: getRepositoryToken(VerificationEntity),
          useValue: repositoryMock,
        },
        {
          provide: WorkersService,
          useValue: workersServiceMock,
        },
        {
          provide: VerificationsRulesService,
          useValue: verificationsRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(VerificationsService);
  });

  it('creates a verification request', async () => {
    workersServiceMock.findMine.mockResolvedValue(workerMock);
    repositoryMock.exists.mockResolvedValue(false);
    repositoryMock.create.mockReturnValue({
      status: VerificationStatus.PENDING,
    } as VerificationEntity);
    repositoryMock.save.mockResolvedValue({
      id: 'verification-1',
      status: VerificationStatus.PENDING,
    } as VerificationEntity);

    const result = await service.request('user-1');

    expect(result.id).toBe('verification-1');
    expect(repositoryMock.save).toHaveBeenCalled();
  });

  it('does not create a request when the rules reject it', async () => {
    workersServiceMock.findMine.mockResolvedValue(workerMock);
    repositoryMock.exists.mockResolvedValue(true);
    verificationsRulesServiceMock.ensureCanRequest.mockImplementationOnce(
      () => {
        throw new ConflictException();
      },
    );

    await expect(service.request('user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('returns the worker verification history', async () => {
    const historyMock = [{ id: 'verification-1' }] as VerificationEntity[];
    workersServiceMock.findMine.mockResolvedValue(workerMock);
    repositoryMock.find.mockResolvedValue(historyMock);

    const result = await service.findMine('user-1');

    expect(result).toEqual(historyMock);
  });

  it('returns a verification or throws if it does not exist', async () => {
    const verificationMock = {
      id: 'verification-1',
    } as VerificationEntity;

    repositoryMock.findOne.mockResolvedValue(verificationMock);

    await expect(service.findOne('verification-1')).resolves.toEqual(
      verificationMock,
    );

    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('verification-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('approves a verification and updates the worker status', async () => {
    const verificationMock = {
      id: 'verification-1',
      status: VerificationStatus.PENDING,
      worker: { id: 'worker-1' },
    } as VerificationEntity;

    repositoryMock.findOne.mockResolvedValue(verificationMock);
    repositoryMock.save.mockImplementation((verification) =>
      Promise.resolve(verification),
    );

    const result = await service.review('verification-1', 'admin-1', {
      status: VerificationStatus.VERIFIED,
    });

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(workersServiceMock.setVerificationStatus).toHaveBeenCalledWith(
      'worker-1',
      VerificationStatus.VERIFIED,
    );
  });

  it('rejects a verification and updates the worker status', async () => {
    const verificationMock = {
      id: 'verification-1',
      status: VerificationStatus.PENDING,
      worker: { id: 'worker-1' },
    } as VerificationEntity;

    repositoryMock.findOne.mockResolvedValue(verificationMock);
    repositoryMock.save.mockImplementation((verification) =>
      Promise.resolve(verification),
    );

    const result = await service.review('verification-1', 'admin-1', {
      status: VerificationStatus.REJECTED,
    });

    expect(result.status).toBe(VerificationStatus.REJECTED);
    expect(workersServiceMock.setVerificationStatus).toHaveBeenCalledWith(
      'worker-1',
      VerificationStatus.REJECTED,
    );
  });
});

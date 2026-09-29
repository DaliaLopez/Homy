import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestRulesService } from './request-rules/request-rules.service';
import { RequestEntity } from './entities/request.entity';
import { UserEntity } from '../users/user.entity';
import { WorkerEntity } from '../workers/worker.entity';
import { ServiceEntity } from '../services/service.entity';
import { beforeEach, describe, it } from 'node:test';
import { expect, jest } from '@jest/globals';

describe('RequestsService', () => {
  let service: RequestsService;

  const mockRequestsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };
  const mockUsersRepository = { findOneBy: jest.fn() };
  const mockWorkersRepository = { findOneBy: jest.fn() };
  const mockServicesRepository = { findOneBy: jest.fn() };
  const mockRequestRulesService = {
    ensureCanBeCreated: jest.fn(),
    ensureCanBeCancelled: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: RequestRulesService, useValue: mockRequestRulesService },
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: mockRequestsRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(WorkerEntity),
          useValue: mockWorkersRepository,
        },
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: mockServicesRepository,
        },
      ],
    }).compile();

    service = module.get(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws NotFoundException when user does not exist', async () => {
    mockUsersRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({
        userId: 999,
        workerId: 1,
        serviceId: 1,
        date: '2028-10-10',
        time: '10:00',
        address: 'Calle 5',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
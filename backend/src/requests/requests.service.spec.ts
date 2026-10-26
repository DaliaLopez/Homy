import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { RequestsService } from './requests.service';
import { RequestEntity } from './entities/request.entity';
import { Test } from '@nestjs/testing';
import { RequestsRulesService } from './request-rules/request-rules.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RequestStatus } from './enums/request-status.enum';
import { AvailabilityService } from '../availability/availability.service';

describe('RequestsServiceTest', () => {
  let service: RequestsService;

  const repositoryMock = {
    find: jest.fn<() => Promise<RequestEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<RequestEntity | null>>(),
    create: jest.fn<(request: Partial<RequestEntity>) => RequestEntity>(),
    save: jest.fn<(request: RequestEntity) => Promise<RequestEntity>>(),
  };

  const requestsRulesServiceMock = {
    ensureCanBeUpdated: jest.fn(),
  };

  const availabilityServiceMock = {
    ensureRequestFitsAvailability: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: repositoryMock,
        },
        {
          provide: RequestsRulesService,
          useValue: requestsRulesServiceMock,
        },
        {
          provide: AvailabilityService,
          useValue: availabilityServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(RequestsService);
  });

  it('returns a request when the id exists', async () => {
    const requestMock = {
      id: 'uuid-1',
      description: 'Reparar tubería',
      status: RequestStatus.REQUESTED,
    } as RequestEntity;

    repositoryMock.findOne.mockResolvedValue(requestMock);

    const result = await service.findOne('uuid-1');

    expect(result).toEqual(requestMock);
    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'uuid-1' },
      relations: ['client'],
    });
  });

  it('throws NotFoundException when the request does not exist', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('uuid-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a request successfully with REQUESTED status', async () => {
    const dto = {
      description: 'Pintar pared',
      scheduledAt: '2026-12-01T10:00:00Z',
      address: 'Calle 123 #45-67, Jamundí',
      price: 150000,
      workerId: 'uuid-worker',
      serviceId: 'uuid-service',
    };

    const createdRequest = {
      ...dto,
      status: RequestStatus.REQUESTED,
    } as unknown as RequestEntity;
    const savedRequest = { ...createdRequest, id: 'uuid-1' };

    repositoryMock.create.mockReturnValue(createdRequest);
    repositoryMock.save.mockResolvedValue(savedRequest);

    const result = await service.create('uuid-client', dto);

    expect(repositoryMock.save).toHaveBeenCalledWith(createdRequest);
    expect(result.id).toEqual('uuid-1');
  });

  it('updates request status and calls rules service', async () => {
    const requestMock = {
      id: 'uuid-1',
      status: RequestStatus.REQUESTED,
    } as RequestEntity;

    const dto = { status: RequestStatus.ACCEPTED };

    repositoryMock.findOne.mockResolvedValue(requestMock);
    repositoryMock.save.mockResolvedValue({
      ...requestMock,
      status: RequestStatus.ACCEPTED,
    });

    const result = await service.updateStatus('uuid-1', dto);

    expect(requestsRulesServiceMock.ensureCanBeUpdated).toHaveBeenCalledWith(
      requestMock,
      RequestStatus.ACCEPTED,
    );
    expect(repositoryMock.save).toHaveBeenCalled();
    expect(result.status).toEqual(RequestStatus.ACCEPTED);
  });
});

import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { RequestsService } from './requests.service';
import { RequestEntity } from './entities/request.entity';
import { RequestsRulesService } from './request-rules/request-rules.service';
import { RequestStatus } from './enums/request-status.enum';
import { AvailabilityService } from '../availability/availability.service';
import { ServicesService } from '../services/services.service';
import { WorkersService } from '../workers/workers.service';
import { ServiceEntity } from '../services/entities/service.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';

describe('RequestsServiceTest', () => {
  let service: RequestsService;

  const repositoryMock = {
    find: jest.fn<(options: any) => Promise<RequestEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<RequestEntity | null>>(),
    create: jest.fn<(request: any) => RequestEntity>(),
    save: jest.fn<(request: RequestEntity) => Promise<RequestEntity>>(),
  };

  const requestsRulesServiceMock = {
    ensureCanBeCreated: jest.fn(),
    ensureCanBeUpdated: jest.fn(),
    ensureActorCanSetStatus: jest.fn(),
  };

  const availabilityServiceMock = {
    ensureRequestFitsAvailability: jest.fn(),
  };

  const workersServiceMock = {
    findOne: jest.fn<(id: string) => Promise<WorkerEntity>>(),
    findMine: jest.fn<(userId: string) => Promise<WorkerEntity>>(),
  };

  const servicesServiceMock = {
    findOne: jest.fn<(id: string) => Promise<ServiceEntity>>(),
  };

  const buildRequest = () =>
    ({
      id: 'uuid-1',
      status: RequestStatus.REQUESTED,
      workerId: 'worker-1',
      serviceId: 'service-1',
      scheduledAt: new Date('2030-01-01T10:00:00Z'),
      client: { id: 'user-client' },
    }) as unknown as RequestEntity;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        { provide: getRepositoryToken(RequestEntity), useValue: repositoryMock },
        { provide: RequestsRulesService, useValue: requestsRulesServiceMock },
        { provide: AvailabilityService, useValue: availabilityServiceMock },
        { provide: WorkersService, useValue: workersServiceMock },
        { provide: ServicesService, useValue: servicesServiceMock },
      ],
    }).compile();

    service = moduleRef.get(RequestsService);
  });

  it('returns a request when the id exists', async () => {
    const requestMock = buildRequest();
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

  it('creates a request using the price of the service', async () => {
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
      user: { id: 'user-worker' },
    } as unknown as WorkerEntity);
    servicesServiceMock.findOne.mockResolvedValue({
      id: 'service-1',
      price: 150000,
      isActive: true,
      worker: { id: 'worker-1' },
    } as unknown as ServiceEntity);

    const createdRequest = { status: RequestStatus.REQUESTED } as RequestEntity;
    repositoryMock.create.mockReturnValue(createdRequest);
    repositoryMock.save.mockResolvedValue({
      ...createdRequest,
      id: 'uuid-1',
    } as RequestEntity);

    const result = await service.create('user-client', {
      description: 'Pintar pared',
      scheduledAt: '2030-12-01T10:00:00Z',
      address: 'Calle 123 #45-67, Jamundí',
      workerId: 'worker-1',
      serviceId: 'service-1',
    });

    expect(requestsRulesServiceMock.ensureCanBeCreated).toHaveBeenCalled();
    expect(repositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 150000,
        workerId: 'worker-1',
        serviceId: 'service-1',
        status: RequestStatus.REQUESTED,
      }),
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(createdRequest);
    expect(result.id).toEqual('uuid-1');
  });

  it('lets the client cancel without checking availability', async () => {
    repositoryMock.findOne.mockResolvedValue(buildRequest());
    repositoryMock.save.mockImplementation((r) => Promise.resolve(r));

    const result = await service.updateStatus('uuid-1', 'user-client', {
      status: RequestStatus.CANCELLED,
    });

    expect(requestsRulesServiceMock.ensureCanBeUpdated).toHaveBeenCalled();
    expect(
      requestsRulesServiceMock.ensureActorCanSetStatus,
    ).toHaveBeenCalledWith(RequestStatus.CANCELLED, 'client');
    expect(
      availabilityServiceMock.ensureRequestFitsAvailability,
    ).not.toHaveBeenCalled();
    expect(result.status).toEqual(RequestStatus.CANCELLED);
  });

  it('lets the assigned worker accept after checking availability', async () => {
    const requestMock = buildRequest();
    repositoryMock.findOne.mockResolvedValue(requestMock);
    workersServiceMock.findMine.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    repositoryMock.save.mockImplementation((r) => Promise.resolve(r));

    const result = await service.updateStatus('uuid-1', 'user-worker', {
      status: RequestStatus.ACCEPTED,
    });

    expect(
      requestsRulesServiceMock.ensureActorCanSetStatus,
    ).toHaveBeenCalledWith(RequestStatus.ACCEPTED, 'worker');
    expect(
      availabilityServiceMock.ensureRequestFitsAvailability,
    ).toHaveBeenCalledWith(
      'worker-1',
      'service-1',
      requestMock.scheduledAt,
      'uuid-1',
    );
    expect(result.status).toEqual(RequestStatus.ACCEPTED);
  });

  it('throws ForbiddenException when a stranger changes the status', async () => {
    repositoryMock.findOne.mockResolvedValue(buildRequest());
    workersServiceMock.findMine.mockRejectedValue(new NotFoundException());

    await expect(
      service.updateStatus('uuid-1', 'stranger', {
        status: RequestStatus.ACCEPTED,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when a stranger reads the request', async () => {
    repositoryMock.findOne.mockResolvedValue(buildRequest());
    workersServiceMock.findMine.mockResolvedValue({
      id: 'worker-999',
    } as WorkerEntity);

    await expect(
      service.findOneForUser('uuid-1', 'stranger'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the requests received by the worker', async () => {
    workersServiceMock.findMine.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    repositoryMock.find.mockResolvedValue([]);

    await service.findAllByWorker('user-worker');

    expect(repositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workerId: 'worker-1' } }),
    );
  });
});
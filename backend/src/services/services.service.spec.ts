/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { ServicesService } from './services.service';
import { ServiceEntity } from './entities/service.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { ServicesRulesService } from './services-rules/services-rules.service';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesServiceTest', () => {
  let service: ServicesService;

  const repositoryMock = {
    find: jest.fn<(options?: any) => Promise<ServiceEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<ServiceEntity | null>>(),
    create: jest.fn<(data: any) => ServiceEntity>(),
    save: jest.fn<(entity: ServiceEntity) => Promise<ServiceEntity>>(),
    remove: jest.fn<(entity: ServiceEntity) => Promise<ServiceEntity>>(),
  };

  const categoryRepositoryMock = {
    findOneBy: jest.fn<(options: any) => Promise<CategoryEntity | null>>(),
  };

  const workerRepositoryMock = {
    findOne: jest.fn<(options: any) => Promise<WorkerEntity | null>>(),
  };

  const requestsRepositoryMock = {
    find: jest.fn<(options: any) => Promise<RequestEntity[]>>(),
  };

  const servicesRulesServiceMock = {
    ensureCanBeModified: jest.fn(),
    ensureHasNoActiveRequests: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoryRepositoryMock,
        },
        {
          provide: getRepositoryToken(WorkerEntity),
          useValue: workerRepositoryMock,
        },
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: requestsRepositoryMock,
        },
        {
          provide: ServicesRulesService,
          useValue: servicesRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ServicesService);
  });


  it('returns all services', async () => {
    const servicesMock = [
      { id: 'service-1', name: 'Plumbing' },
      { id: 'service-2', name: 'Painting' },
    ] as ServiceEntity[];

    repositoryMock.find.mockResolvedValue(servicesMock);

    const result = await service.findAll();

    expect(result).toEqual(servicesMock);
    expect(repositoryMock.find).toHaveBeenCalledWith({
      relations: { category: true, worker: true },
      order: { createdAt: 'DESC' },
    });
  });

  it('returns a service when it exists', async () => {
    const serviceMock = { id: 'service-1', name: 'Plumbing' } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);

    await expect(service.findOne('service-1')).resolves.toEqual(serviceMock);
  });

  it('throws NotFoundException when the service does not exist', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('service-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a service successfully', async () => {
    const categoryMock = {
      id: 'category-1',
      isActive: true,
    } as CategoryEntity;

    const workerMock = { id: 'worker-1' } as WorkerEntity;

    const dto: CreateServiceDto = {
      name: 'Repair a pipe',
      description: 'Home pipe repair',
      price: 100000,
      durationMinutes: 60,
      categoryId: 'category-1',
    };

    const createdService = {
      ...dto,
      id: 'service-1',
      category: categoryMock,
      worker: workerMock,
      isActive: true,
      createdAt: new Date(),
    } as ServiceEntity;

    categoryRepositoryMock.findOneBy.mockResolvedValue(categoryMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    repositoryMock.create.mockReturnValue(createdService);
    repositoryMock.save.mockResolvedValue(createdService);

    const result = await service.create('user-1', dto);

    expect(repositoryMock.create).toHaveBeenCalledWith({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      durationMinutes: dto.durationMinutes,
      category: categoryMock,
      worker: workerMock,
      isActive: true,
    });
    expect(result).toEqual(createdService);
  });

  it('throws ConflictException when the category is inactive', async () => {
    categoryRepositoryMock.findOneBy.mockResolvedValue({
      id: 'category-1',
      isActive: false,
    } as CategoryEntity);

    const dto: CreateServiceDto = {
      name: 'Repair a pipe',
      description: 'Home pipe repair',
      price: 100000,
      durationMinutes: 60,
      categoryId: 'category-1',
    };

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(workerRepositoryMock.findOne).not.toHaveBeenCalled();
  });

  it('updates a service and checks active requests', async () => {
    const workerMock = { id: 'worker-1' } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Old name',
      description: 'Old description',
      price: 80000,
      durationMinutes: 30,
      worker: workerMock,
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    const dto: UpdateServiceDto = {
      name: 'New name',
      durationMinutes: 60,
    };

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    repositoryMock.save.mockImplementation(async (entity) => entity);

    const result = await service.update('service-1', 'user-1', dto);

    expect(servicesRulesServiceMock.ensureCanBeModified).toHaveBeenCalledWith(
      serviceMock,
      'worker-1',
    );
    expect(
      servicesRulesServiceMock.ensureHasNoActiveRequests,
    ).toHaveBeenCalledWith([]);
    expect(serviceMock.name).toBe('New name');
    expect(serviceMock.durationMinutes).toBe(60);
    expect(result).toEqual(serviceMock);
  });

  it('throws ConflictException when active requests exist', async () => {
    const workerMock = { id: 'worker-1' } as WorkerEntity;
    const serviceMock = {
      id: 'service-1',
      worker: workerMock,
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([
      { status: RequestStatus.ACCEPTED } as RequestEntity,
    ]);

    servicesRulesServiceMock.ensureHasNoActiveRequests.mockImplementation(
      (statuses) => {
        if ((statuses as RequestStatus[]).length > 0) {
          throw new ConflictException('Active requests exist');
        }
      },
    );

    await expect(
      service.update('service-1', 'user-1', { name: 'New name' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('deletes a service successfully', async () => {
    const workerMock = { id: 'worker-1' } as WorkerEntity;
    const serviceMock = {
      id: 'service-1',
      worker: workerMock,
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    repositoryMock.remove.mockResolvedValue(serviceMock);

    const result = await service.remove('service-1', 'user-1');

    expect(repositoryMock.remove).toHaveBeenCalledWith(serviceMock);
    expect(result).toEqual({
      message: 'Service deleted successfully',
    });
  });
});

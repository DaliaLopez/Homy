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
      relations: {
        category: true,
        worker: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  });

  it('returns a service when the id exists', async () => {
    const serviceMock = {
      id: 'service-1',
      name: 'Repair a washing machine',
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);

    const result = await service.findOne('service-1');

    expect(result).toEqual(serviceMock);
    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      relations: {
        category: true,
        worker: true,
      },
    });
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
      name: 'Plumbing',
    } as CategoryEntity;

    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const dto: CreateServiceDto = {
      name: 'Repair a pipe',
      description: 'Home pipe repair service',
      price: 100000,
      categoryId: 'category-1',
    };

    const createdService = {
      ...dto,
      id: 'service-1',
      category: categoryMock,
      worker: workerMock,
    } as unknown as ServiceEntity;

    categoryRepositoryMock.findOneBy.mockResolvedValue(categoryMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    repositoryMock.create.mockReturnValue(createdService);
    repositoryMock.save.mockResolvedValue(createdService);

    const result = await service.create('user-1', dto);

    expect(categoryRepositoryMock.findOneBy).toHaveBeenCalledWith({
      id: dto.categoryId,
    });

    expect(workerRepositoryMock.findOne).toHaveBeenCalledWith({
      where: {
        user: { id: 'user-1' },
      },
    });

    expect(repositoryMock.save).toHaveBeenCalledWith(createdService);
    expect(result).toEqual(createdService);
  });

  it('throws NotFoundException when the category does not exist during creation', async () => {
    const dto: CreateServiceDto = {
      name: 'Repair a pipe',
      description: 'Home pipe repair service',
      price: 100000,
      categoryId: 'category-1',
    };

    categoryRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(workerRepositoryMock.findOne).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the worker profile does not exist during creation', async () => {
    const categoryMock = {
      id: 'category-1',
    } as CategoryEntity;

    const dto: CreateServiceDto = {
      name: 'Repair a pipe',
      description: 'Home pipe repair service',
      price: 100000,
      categoryId: 'category-1',
    };

    categoryRepositoryMock.findOneBy.mockResolvedValue(categoryMock);
    workerRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('updates a service and calls the business rules', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Old service name',
      description: 'Old description',
      price: 80000,
      worker: workerMock,
      category: { id: 'category-1' },
    } as ServiceEntity;

    const dto: UpdateServiceDto = {
      name: 'New service name',
      price: 100000,
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

    expect(serviceMock.name).toBe('New service name');
    expect(serviceMock.price).toBe(100000);
    expect(serviceMock.description).toBe('Old description');
    expect(repositoryMock.save).toHaveBeenCalledWith(serviceMock);
    expect(result).toEqual(serviceMock);
  });

  it('throws NotFoundException when updating a service that does not exist', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.update('service-1', 'user-1', {
        name: 'New name',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('throws ConflictException when active requests prevent updating a service', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Plumbing',
      worker: workerMock,
      category: { id: 'category-1' },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([
      { status: RequestStatus.REQUESTED } as RequestEntity,
    ]);

    servicesRulesServiceMock.ensureHasNoActiveRequests.mockImplementation(
      (statuses: RequestStatus[]) => {
        if (statuses.includes(RequestStatus.REQUESTED)) {
          throw new ConflictException('Service has active requests');
        }
      },
    );

    await expect(
      service.update('service-1', 'user-1', {
        name: 'New name',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  it('deletes a service when it belongs to the worker and has no active requests', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      worker: workerMock,
      category: { id: 'category-1' },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    repositoryMock.remove.mockResolvedValue(serviceMock);

    const result = await service.remove('service-1', 'user-1');

    expect(servicesRulesServiceMock.ensureCanBeModified).toHaveBeenCalledWith(
      serviceMock,
      'worker-1',
    );

    expect(
      servicesRulesServiceMock.ensureHasNoActiveRequests,
    ).toHaveBeenCalledWith([]);

    expect(repositoryMock.remove).toHaveBeenCalledWith(serviceMock);
    expect(result).toEqual({
      message: 'Service deleted successfully',
    });
  });

  it('throws ConflictException when active requests prevent deleting a service', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      worker: workerMock,
      category: { id: 'category-1' },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([
      { status: RequestStatus.IN_PROGRESS } as RequestEntity,
    ]);

    servicesRulesServiceMock.ensureHasNoActiveRequests.mockImplementation(
      (statuses: RequestStatus[]) => {
        if (statuses.includes(RequestStatus.IN_PROGRESS)) {
          throw new ConflictException('Service has active requests');
        }
      },
    );

    await expect(service.remove('service-1', 'user-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repositoryMock.remove).not.toHaveBeenCalled();
  });
});

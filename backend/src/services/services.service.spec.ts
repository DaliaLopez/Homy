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

  // Consultar todos los servicios.
  it('returns all services', async () => {
    const servicesMock = [
      { id: 'service-1', name: 'Plumbing', isActive: true },
      { id: 'service-2', name: 'Painting', isActive: true },
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

  // Consultar un servicio por su id.
  it('returns a service when the id exists', async () => {
    const serviceMock = {
      id: 'service-1',
      name: 'Repair a washing machine',
      isActive: true,
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

  // Crear un servicio correctamente y comprobar que quede activo.
  it('creates a service successfully with isActive true', async () => {
    const categoryMock = {
      id: 'category-1',
      name: 'Plumbing',
      isActive: true,
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
      name: dto.name,
      description: dto.description,
      price: dto.price,
      id: 'service-1',
      category: categoryMock,
      worker: workerMock,
      isActive: true,
    } as ServiceEntity;

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

    expect(repositoryMock.create).toHaveBeenCalledWith({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category: categoryMock,
      worker: workerMock,
      isActive: true,
    });

    expect(repositoryMock.save).toHaveBeenCalledWith(createdService);
    expect(result).toEqual(createdService);
  });

  // No se puede crear un servicio si la categoría no existe.
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
    expect(repositoryMock.create).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // No se puede crear un servicio en una categoría inactiva.
  it('throws ConflictException when creating a service in an inactive category', async () => {
    const categoryMock = {
      id: 'category-1',
      name: 'Plumbing',
      isActive: false,
    } as CategoryEntity;

    const dto: CreateServiceDto = {
      name: 'Repair a pipe',
      description: 'Home pipe repair service',
      price: 100000,
      categoryId: 'category-1',
    };

    categoryRepositoryMock.findOneBy.mockResolvedValue(categoryMock);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(workerRepositoryMock.findOne).not.toHaveBeenCalled();
    expect(repositoryMock.create).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // No se puede crear un servicio si el trabajador no tiene perfil.
  it('throws NotFoundException when the worker profile does not exist during creation', async () => {
    const categoryMock = {
      id: 'category-1',
      isActive: true,
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

    expect(repositoryMock.create).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // Actualizar un servicio sin cambiar su categoría.
  it('updates a service and calls the business rules', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Old service name',
      description: 'Old description',
      price: 80000,
      isActive: true,
      worker: workerMock,
      category: {
        id: 'category-1',
        isActive: true,
      },
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

    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      relations: {
        category: true,
        worker: true,
      },
    });

    expect(requestsRepositoryMock.find).toHaveBeenCalledWith({
      where: {
        service: { id: 'service-1' },
      },
      select: {
        status: true,
      },
    });

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

    expect(categoryRepositoryMock.findOneBy).not.toHaveBeenCalled();
    expect(repositoryMock.save).toHaveBeenCalledWith(serviceMock);
    expect(result).toEqual(serviceMock);
  });

  // No se puede actualizar un servicio que no existe.
  it('throws NotFoundException when updating a service that does not exist', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.update('service-1', 'user-1', {
        name: 'New name',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(workerRepositoryMock.findOne).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // No se puede actualizar si el usuario no tiene perfil de trabajador.
  it('throws NotFoundException when the worker profile does not exist during update', async () => {
    const serviceMock = {
      id: 'service-1',
      worker: { id: 'worker-1' },
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.update('service-1', 'user-1', {
        name: 'New name',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(requestsRepositoryMock.find).not.toHaveBeenCalled();
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // No se puede asignar un servicio a una categoría que no existe.
  it('throws NotFoundException when the new category does not exist during update', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Plumbing',
      worker: workerMock,
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    categoryRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(
      service.update('service-1', 'user-1', {
        categoryId: 'category-2',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(categoryRepositoryMock.findOneBy).toHaveBeenCalledWith({
      id: 'category-2',
    });

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // No se puede cambiar el servicio a una categoría inactiva.
  it('throws ConflictException when assigning an inactive category during update', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Plumbing',
      worker: workerMock,
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    const inactiveCategory = {
      id: 'category-2',
      isActive: false,
    } as CategoryEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    categoryRepositoryMock.findOneBy.mockResolvedValue(inactiveCategory);

    await expect(
      service.update('service-1', 'user-1', {
        categoryId: 'category-2',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repositoryMock.save).not.toHaveBeenCalled();
  });

  // Se puede cambiar a una categoría activa.
  it('updates the category when the new category is active', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      name: 'Plumbing',
      worker: workerMock,
      category: {
        id: 'category-1',
        isActive: true,
      },
    } as ServiceEntity;

    const activeCategory = {
      id: 'category-2',
      isActive: true,
    } as CategoryEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    categoryRepositoryMock.findOneBy.mockResolvedValue(activeCategory);
    repositoryMock.save.mockImplementation(async (entity) => entity);

    const result = await service.update('service-1', 'user-1', {
      categoryId: 'category-2',
    });

    expect(serviceMock.category).toBe(activeCategory);
    expect(repositoryMock.save).toHaveBeenCalledWith(serviceMock);
    expect(result).toEqual(serviceMock);
  });

  // Las solicitudes REQUESTED, ACCEPTED e IN_PROGRESS bloquean la modificación.
  it.each([
    RequestStatus.REQUESTED,
    RequestStatus.ACCEPTED,
    RequestStatus.IN_PROGRESS,
  ])(
    'throws ConflictException when an active request (%s) prevents updating a service',
    async (status) => {
      const workerMock = {
        id: 'worker-1',
      } as WorkerEntity;

      const serviceMock = {
        id: 'service-1',
        name: 'Plumbing',
        worker: workerMock,
        category: { id: 'category-1', isActive: true },
      } as ServiceEntity;

      repositoryMock.findOne.mockResolvedValue(serviceMock);
      workerRepositoryMock.findOne.mockResolvedValue(workerMock);
      requestsRepositoryMock.find.mockResolvedValue([
        { status } as RequestEntity,
      ]);

      servicesRulesServiceMock.ensureHasNoActiveRequests.mockImplementation(
        (...args: any[]) => {
          const statuses = args[0] as RequestStatus[];
          const activeStatuses = [
            RequestStatus.REQUESTED,
            RequestStatus.ACCEPTED,
            RequestStatus.IN_PROGRESS,
          ];

          if (statuses.some((item) => activeStatuses.includes(item))) {
            throw new ConflictException(
              'A service cannot be modified or deleted while it has active requests',
            );
          }
        },
      );

      await expect(
        service.update('service-1', 'user-1', {
          name: 'New name',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repositoryMock.save).not.toHaveBeenCalled();
    },
  );

  // Eliminar un servicio propio sin solicitudes activas.
  it('deletes a service when it belongs to the worker and has no active requests', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const serviceMock = {
      id: 'service-1',
      isActive: true,
      worker: workerMock,
      category: { id: 'category-1', isActive: true },
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

    expect(requestsRepositoryMock.find).toHaveBeenCalledWith({
      where: {
        service: { id: 'service-1' },
      },
      select: {
        status: true,
      },
    });

    expect(
      servicesRulesServiceMock.ensureHasNoActiveRequests,
    ).toHaveBeenCalledWith([]);

    expect(repositoryMock.remove).toHaveBeenCalledWith(serviceMock);
    expect(result).toEqual({
      message: 'Service deleted successfully',
    });
  });

  // No se puede eliminar un servicio si existen solicitudes activas.
  it.each([
    RequestStatus.REQUESTED,
    RequestStatus.ACCEPTED,
    RequestStatus.IN_PROGRESS,
  ])(
    'throws ConflictException when an active request (%s) prevents deleting a service',
    async (status) => {
      const workerMock = {
        id: 'worker-1',
      } as WorkerEntity;

      const serviceMock = {
        id: 'service-1',
        isActive: true,
        worker: workerMock,
        category: { id: 'category-1', isActive: true },
      } as ServiceEntity;

      repositoryMock.findOne.mockResolvedValue(serviceMock);
      workerRepositoryMock.findOne.mockResolvedValue(workerMock);
      requestsRepositoryMock.find.mockResolvedValue([
        { status } as RequestEntity,
      ]);

      servicesRulesServiceMock.ensureHasNoActiveRequests.mockImplementation(
        (...args: unknown[]) => {
          const statuses = args[0] as RequestStatus[];
          const activeStatuses = [
            RequestStatus.REQUESTED,
            RequestStatus.ACCEPTED,
            RequestStatus.IN_PROGRESS,
          ];

          if (statuses.some((item) => activeStatuses.includes(item))) {
            throw new ConflictException(
              'A service cannot be modified or deleted while it has active requests',
            );
          }
        },
      );

      await expect(
        service.remove('service-1', 'user-1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repositoryMock.remove).not.toHaveBeenCalled();
    },
  );

  // No se puede eliminar un servicio si no existe.
  it('throws NotFoundException when deleting a service that does not exist', async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.remove('service-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(workerRepositoryMock.findOne).not.toHaveBeenCalled();
    expect(repositoryMock.remove).not.toHaveBeenCalled();
  });

  // No se puede eliminar un servicio si el trabajador no tiene perfil.
  it('throws NotFoundException when the worker profile does not exist during deletion', async () => {
    const serviceMock = {
      id: 'service-1',
      worker: { id: 'worker-1' },
      category: { id: 'category-1', isActive: true },
    } as ServiceEntity;

    repositoryMock.findOne.mockResolvedValue(serviceMock);
    workerRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.remove('service-1', 'user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(requestsRepositoryMock.find).not.toHaveBeenCalled();
    expect(repositoryMock.remove).not.toHaveBeenCalled();
  });
});

import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { AvailabilityService } from './availability.service';
import { AvailabilityEntity } from './entities/availability.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { AvailabilityRulesService } from './availability-rules/availability-rules.service';

describe('AvailabilityServiceTest', () => {
  let service: AvailabilityService;

  const availabilityRepositoryMock = {
    find: jest.fn<(options?: any) => Promise<AvailabilityEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<AvailabilityEntity | null>>(),
    create: jest.fn<(data: any) => AvailabilityEntity>(),
    save: jest.fn<
      (entity: AvailabilityEntity) => Promise<AvailabilityEntity>
    >(),
    remove:
      jest.fn<(entity: AvailabilityEntity) => Promise<AvailabilityEntity>>(),
  };

  const workerRepositoryMock = {
    findOne: jest.fn<(options: any) => Promise<WorkerEntity | null>>(),
  };

  const requestsRepositoryMock = {
    find: jest.fn<(options: any) => Promise<RequestEntity[]>>(),
  };

  const servicesRepositoryMock = {
    findOne: jest.fn<(options: any) => Promise<ServiceEntity | null>>(),
  };

  const availabilityRulesServiceMock = {
    ensureValidTimeRange: jest.fn(),
    ensureNoOverlap: jest.fn(),
    ensureHasNoRequests: jest.fn(),
    ensureRequestFitsTimeRange: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(AvailabilityEntity),
          useValue: availabilityRepositoryMock,
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
          provide: getRepositoryToken(ServiceEntity),
          useValue: servicesRepositoryMock,
        },
        {
          provide: AvailabilityRulesService,
          useValue: availabilityRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AvailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Consultar las disponibilidades del trabajador.
  it('returns the worker availabilities', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const availabilitiesMock = [
      { id: 'availability-1' },
      { id: 'availability-2' },
    ] as AvailabilityEntity[];

    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    availabilityRepositoryMock.find.mockResolvedValue(availabilitiesMock);

    const result = await service.findAll('user-1');

    expect(result).toEqual(availabilitiesMock);
    expect(availabilityRepositoryMock.find).toHaveBeenCalledWith({
      where: {
        worker: { id: 'worker-1' },
      },
      order: {
        day: 'ASC',
        startTime: 'ASC',
      },
    });
  });

  // No se puede consultar si el usuario no tiene perfil de trabajador.
  it('throws NotFoundException when the worker profile does not exist', async () => {
    workerRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findAll('user-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(availabilityRepositoryMock.find).not.toHaveBeenCalled();
  });

  // Crear una disponibilidad correctamente.
  it('creates an availability successfully', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const dto = {
      day: 'MONDAY',
      startTime: '09:00:00',
      endTime: '12:00:00',
    };

    const availabilityMock = {
      id: 'availability-1',
      ...dto,
      worker: workerMock,
    } as AvailabilityEntity;

    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    availabilityRepositoryMock.find.mockResolvedValue([]);
    availabilityRepositoryMock.create.mockReturnValue(availabilityMock);
    availabilityRepositoryMock.save.mockResolvedValue(availabilityMock);

    const result = await service.create('user-1', dto);

    expect(
      availabilityRulesServiceMock.ensureValidTimeRange,
    ).toHaveBeenCalledWith(dto.startTime, dto.endTime);

    expect(availabilityRulesServiceMock.ensureNoOverlap).toHaveBeenCalledWith(
      dto.startTime,
      dto.endTime,
      [],
    );

    expect(availabilityRepositoryMock.save).toHaveBeenCalledWith(
      availabilityMock,
    );

    expect(result).toEqual(availabilityMock);
  });

  // No se puede consultar una disponibilidad que no existe en el perfil.
  it('throws NotFoundException when the availability does not exist', async () => {
    workerRepositoryMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);

    availabilityRepositoryMock.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('user-1', 'availability-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  // Eliminar una disponibilidad sin solicitudes que se crucen.
  it('deletes an availability successfully', async () => {
    const workerMock = {
      id: 'worker-1',
    } as WorkerEntity;

    const availabilityMock = {
      id: 'availability-1',
      day: 'MONDAY',
      startTime: '09:00:00',
      endTime: '12:00:00',
      worker: workerMock,
    } as AvailabilityEntity;

    workerRepositoryMock.findOne.mockResolvedValue(workerMock);
    availabilityRepositoryMock.findOne.mockResolvedValue(availabilityMock);
    requestsRepositoryMock.find.mockResolvedValue([]);
    availabilityRepositoryMock.remove.mockResolvedValue(availabilityMock);

    const result = await service.remove('user-1', 'availability-1');

    expect(
      availabilityRulesServiceMock.ensureHasNoRequests,
    ).toHaveBeenCalledWith(false);

    expect(availabilityRepositoryMock.remove).toHaveBeenCalledWith(
      availabilityMock,
    );

    expect(result).toEqual({
      message: 'Availability deleted successfully.',
    });
  });
});

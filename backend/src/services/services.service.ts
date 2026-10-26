import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ServiceEntity } from './entities/service.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesRulesService } from './services-rules/services-rules.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,

    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,

    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,

    private readonly servicesRulesService: ServicesRulesService,
  ) {}

  async create(userId: string, dto: CreateServiceDto): Promise<ServiceEntity> {
    // Busca la categoría elegida.
    const category = await this.categoriesRepository.findOneBy({
      id: dto.categoryId,
    });

    if (!category) {
      throw new NotFoundException(
        `Category with id ${dto.categoryId} was not found`,
      );
    }

    // No permite crear servicios en categorías inactivas.
    if (!category.isActive) {
      throw new ConflictException(
        'Cannot create a service in an inactive category',
      );
    }

    // Buscar el perfil del trabajador autenticado.
    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    // Todo servicio se crea activo.
    const service = this.servicesRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category,
      worker,
      isActive: true,
    });

    return this.servicesRepository.save(service);
  }

  findAll(): Promise<ServiceEntity[]> {
    return this.servicesRepository.find({
      relations: {
        category: true,
        worker: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: {
        category: true,
        worker: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${id} was not found`);
    }

    return service;
  }

  // Comprueba los estados de las solicitudes asociadas al servicio.
  private async ensureServiceHasNoActiveRequests(
    serviceId: string,
  ): Promise<void> {
    const requests = await this.requestsRepository.find({
      where: {
        service: { id: serviceId },
      },
      select: {
        status: true,
      },
    });

    const statuses = requests.map((request) => request.status);

    this.servicesRulesService.ensureHasNoActiveRequests(statuses);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    const service = await this.findOne(id);

    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    // Solo el trabajador propietario puede modificar el servicio.
    this.servicesRulesService.ensureCanBeModified(service, worker.id);

    // No se puede modificar mientras existan solicitudes activas.
    await this.ensureServiceHasNoActiveRequests(id);

    if (dto.categoryId !== undefined) {
      const category = await this.categoriesRepository.findOneBy({
        id: dto.categoryId,
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} was not found`,
        );
      }

      // No permite mover el servicio a una categoría inactiva.
      if (!category.isActive) {
        throw new ConflictException(
          'Cannot assign an inactive category to a service',
        );
      }

      service.category = category;
    }

    if (dto.name !== undefined) {
      service.name = dto.name;
    }

    if (dto.description !== undefined) {
      service.description = dto.description;
    }

    if (dto.price !== undefined) {
      service.price = dto.price;
    }

    return this.servicesRepository.save(service);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const service = await this.findOne(id);

    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    // Solo el trabajador propietario puede eliminar el servicio.
    this.servicesRulesService.ensureCanBeModified(service, worker.id);

    //  No se puede eliminar si hay solicitudes REQUESTED, ACCEPTED o IN_PROGRESS.
    await this.ensureServiceHasNoActiveRequests(id);

    // Se elimina el servicio pero no la categoría.
    await this.servicesRepository.remove(service);

    return {
      message: 'Service deleted successfully',
    };
  }
}

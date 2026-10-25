import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ServiceEntity } from './entities/service.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { RequestEntity } from '../requests/entities/request.entity';

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
    // Buscar la categoría seleccionada.
    const category = await this.categoriesRepository.findOneBy({
      id: dto.categoryId,
    });

    if (!category) {
      throw new NotFoundException(
        `Category with id ${dto.categoryId} was not found`,
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

    // Crear el servicio asociado a ese perfil.
    const service = this.servicesRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category,
      worker,
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

  // Busca las solicitudes relacionadas con un servicio y verifica sus estados.
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
    // Buscar el servicio.
    const service = await this.findOne(id);

    // Buscar el perfil del trabajador autenticado.
    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    // Verificar que el servicio pertenezca al trabajador.
    this.servicesRulesService.ensureCanBeModified(service, worker.id);

    // Impedir cambios si existen solicitudes activas.
    await this.ensureServiceHasNoActiveRequests(id);

    // Buscar y asignar una categoría nueva, si fue enviada.
    if (dto.categoryId !== undefined) {
      const category = await this.categoriesRepository.findOneBy({
        id: dto.categoryId,
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} was not found`,
        );
      }

      service.category = category;
    }

    // Actualizar el nombre, si fue enviado.
    if (dto.name !== undefined) {
      service.name = dto.name;
    }

    // Actualizar la descripción, si fue enviada.
    if (dto.description !== undefined) {
      service.description = dto.description;
    }

    // Actualizar el precio, si fue enviado.
    if (dto.price !== undefined) {
      service.price = dto.price;
    }

    return this.servicesRepository.save(service);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    // Buscar el servicio.
    const service = await this.findOne(id);

    // Buscar el perfil del trabajador autenticado.
    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    // Verificar que el servicio pertenezca al trabajador.
    this.servicesRulesService.ensureCanBeModified(service, worker.id);

    // Impedir la eliminación si hay solicitudes activas.
    await this.ensureServiceHasNoActiveRequests(id);

    await this.servicesRepository.remove(service);

    return {
      message: 'Service deleted successfully',
    };
  }
}

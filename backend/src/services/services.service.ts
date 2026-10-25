import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ServiceEntity } from './entities/service.entity';
import { CategoryEntity } from '../categories/entities/category.entity';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,

    @InjectRepository(WorkerProfileEntity)
    private readonly workersRepository: Repository<WorkerProfileEntity>,
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

    // Buscar el perfil de trabajador del usuario autenticado.
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

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceEntity> {
    //Buscar el servicio que queremos actualizar.
    const service = await this.findOne(id);

    //Revisa si se envio una categoría nueva.
    if (dto.categoryId !== undefined) {
      // Si se envia una categoria nueva la busca en la base de datos.
      const category = await this.categoriesRepository.findOneBy({
        id: dto.categoryId,
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} was not found`,
        );
      }

      //Asigna la nueva categoría al servicio.
      service.category = category;
    }

    //Revisa si enviaron valores nuevos para los demás campos del servicio.
    if (dto.name !== undefined) {
      service.name = dto.name;
    }

    if (dto.description !== undefined) {
      service.description = dto.description;
    }

    if (dto.price !== undefined) {
      service.price = dto.price;
    }

    //Guarda los cambios actualizados en la base de datos.
    return this.servicesRepository.save(service);
  }

  async remove(id: string): Promise<{ message: string }> {
    const service = await this.findOne(id);

    await this.servicesRepository.remove(service);

    return {
      message: 'Service deleted successfully',
    };
  }
}

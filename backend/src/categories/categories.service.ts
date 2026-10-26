import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoryEntity } from './entities/category.entity';
import { ServiceEntity } from '../services/entities/service.entity';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesRulesService } from './categories-rules/categories-rules.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,

    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,

    private readonly rulesService: CategoriesRulesService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const name = dto.name.trim();

    const categories = await this.categoriesRepository.find();

    const existingCategory = categories.find(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    );

    this.rulesService.ensureNameIsAvailable(existingCategory ?? null);

    const category = this.categoriesRepository.create({
      name,
      description: dto.description?.trim() || null,
      isActive: true,
    });

    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<CategoryEntity[]> {
    return this.categoriesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { services: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} was not found`);
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const category = await this.findOne(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const categories = await this.categoriesRepository.find();

      const existingCategory = categories.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      );

      this.rulesService.ensureNameIsAvailable(existingCategory ?? null, id);

      category.name = name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description.trim() || null;
    }

    return this.categoriesRepository.save(category);
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);

    // Verifica que la categoría esté activa.
    this.rulesService.ensureCategoryIsActive(category);

    // Cuenta solo los servicios activos de esta categoría.
    const activeServicesCount = await this.servicesRepository.count({
      where: {
        category: { id },
        isActive: true,
      },
    });

    // Si hay uno o más servicios activos, la regla lanza ConflictException.
    this.rulesService.ensureCategoryHasNoActiveServices(
      activeServicesCount > 0,
    );

    // Solo se desactiva cuando no quedan servicios activos dentro de la categoria.
    category.isActive = false;
    await this.categoriesRepository.save(category);

    return {
      message: 'Category deactivated successfully',
    };
  }
}

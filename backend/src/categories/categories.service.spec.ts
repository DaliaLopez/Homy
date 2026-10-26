/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CategoryEntity } from './entities/category.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { CategoriesRulesService } from './categories-rules/categories-rules.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const categoriesRepositoryMock = {
    find: jest.fn<(options: any) => Promise<CategoryEntity[]>>(),
    findOne: jest.fn<(options: any) => Promise<CategoryEntity | null>>(),
    create: jest.fn<(data: any) => CategoryEntity>(),
    save: jest.fn<(entity: CategoryEntity) => Promise<CategoryEntity>>(),
  };

  const servicesRepositoryMock = {
    count: jest.fn<(options: any) => Promise<number>>(),
  };

  const rulesServiceMock = {
    ensureNameIsAvailable:
      jest.fn<
        (existingCategory: CategoryEntity | null, categoryId?: string) => void
      >(),
    ensureCategoryIsActive: jest.fn(),
    ensureCategoryHasNoActiveServices: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoriesRepositoryMock,
        },
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: servicesRepositoryMock,
        },
        {
          provide: CategoriesRulesService,
          useValue: rulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
  });

  // Crear una categoría correctamente.
  it('creates a category successfully', async () => {
    const dto: CreateCategoryDto = {
      name: '  Plumbing  ',
      description: '  Plumbing services  ',
    };

    const createdCategory = {
      id: 'category-1',
      name: 'Plumbing',
      description: 'Plumbing services',
      isActive: true,
    } as CategoryEntity;

    categoriesRepositoryMock.find.mockResolvedValue([]);
    categoriesRepositoryMock.create.mockReturnValue(createdCategory);
    categoriesRepositoryMock.save.mockResolvedValue(createdCategory);

    const result = await service.create(dto);

    expect(categoriesRepositoryMock.find).toHaveBeenCalled();

    expect(rulesServiceMock.ensureNameIsAvailable).toHaveBeenCalledWith(null);

    expect(categoriesRepositoryMock.create).toHaveBeenCalledWith({
      name: 'Plumbing',
      description: 'Plumbing services',
      isActive: true,
    });

    expect(categoriesRepositoryMock.save).toHaveBeenCalledWith(createdCategory);

    expect(result).toEqual(createdCategory);
  });

  // Evitar crear una categoría con un nombre duplicado.
  it('throws ConflictException when creating a category with a duplicate name', async () => {
    const existingCategory = {
      id: 'category-1',
      name: 'Plumbing',
      isActive: true,
    } as CategoryEntity;

    categoriesRepositoryMock.find.mockResolvedValue([existingCategory]);

    rulesServiceMock.ensureNameIsAvailable.mockImplementation(() => {
      throw new ConflictException('A category with this name already exists');
    });

    await expect(
      service.create({
        name: '  PLUMBING ',
        description: 'Plumbing services',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(categoriesRepositoryMock.create).not.toHaveBeenCalled();
    expect(categoriesRepositoryMock.save).not.toHaveBeenCalled();
  });

  // Si no se proporciona una descripción, guardar null.
  it('creates a category with null description when the description is empty', async () => {
    const dto: CreateCategoryDto = {
      name: 'Painting',
      description: '   ',
    };

    const createdCategory = {
      id: 'category-2',
      name: 'Painting',
      description: null,
      isActive: true,
    } as CategoryEntity;

    categoriesRepositoryMock.find.mockResolvedValue([]);
    categoriesRepositoryMock.create.mockReturnValue(createdCategory);
    categoriesRepositoryMock.save.mockResolvedValue(createdCategory);

    const result = await service.create(dto);

    expect(categoriesRepositoryMock.create).toHaveBeenCalledWith({
      name: 'Painting',
      description: null,
      isActive: true,
    });

    expect(result).toEqual(createdCategory);
  });

  // Consultar las categorías activas ordenadas por nombre.
  it('returns only active categories ordered by name', async () => {
    const categories = [
      { id: 'category-1', name: 'Painting', isActive: true },
      { id: 'category-2', name: 'Plumbing', isActive: true },
    ] as CategoryEntity[];

    categoriesRepositoryMock.find.mockResolvedValue(categories);

    const result = await service.findAll();

    expect(categoriesRepositoryMock.find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    expect(result).toEqual(categories);
  });

  // Consultar una categoría por su id.
  it('returns a category when it exists', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);

    const result = await service.findOne('category-1');

    expect(categoriesRepositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 'category-1' },
      relations: { services: true },
    });

    expect(result).toEqual(category);
  });

  // Lanzar NotFoundException si la categoría no existe.
  it('throws NotFoundException when the category does not exist', async () => {
    categoriesRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne('category-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  // Actualizar el nombre y la descripción de una categoría.
  it('updates the category name and description', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      description: 'Old description',
      isActive: true,
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);
    categoriesRepositoryMock.find.mockResolvedValue([category]);
    categoriesRepositoryMock.save.mockImplementation(async (entity) => entity);

    const dto: UpdateCategoryDto = {
      name: '  Home Repairs  ',
      description: '  New description  ',
    };

    const result = await service.update('category-1', dto);

    expect(rulesServiceMock.ensureNameIsAvailable).toHaveBeenCalledWith(
      category,
      'category-1',
    );

    expect(category.name).toBe('Home Repairs');
    expect(category.description).toBe('New description');
    expect(categoriesRepositoryMock.save).toHaveBeenCalledWith(category);
    expect(result).toEqual(category);
  });

  // Permitir actualizar la descripción sin cambiar el nombre.
  it('updates only the description when the name is not provided', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      description: 'Old description',
      isActive: true,
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);
    categoriesRepositoryMock.save.mockImplementation(async (entity) => entity);

    const dto: UpdateCategoryDto = {
      description: 'Updated description',
    };

    const result = await service.update('category-1', dto);

    expect(categoriesRepositoryMock.find).not.toHaveBeenCalled();
    expect(category.name).toBe('Plumbing');
    expect(category.description).toBe('Updated description');
    expect(result).toEqual(category);
  });

  // Guardar null si la descripción actualizada queda vacía.
  it('sets description to null when the updated description is empty', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      description: 'Old description',
      isActive: true,
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);
    categoriesRepositoryMock.save.mockImplementation(async (entity) => entity);

    const result = await service.update('category-1', {
      description: '   ',
    });

    expect(category.description).toBeNull();
    expect(result).toEqual(category);
  });

  // Evitar actualizar una categoría con el nombre de otra.
  it('throws ConflictException when updating to another category name', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      description: 'Description',
      isActive: true,
      services: [],
    } as unknown as CategoryEntity;

    const anotherCategory = {
      id: 'category-2',
      name: 'Painting',
      isActive: true,
    } as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);
    categoriesRepositoryMock.find.mockResolvedValue([
      category,
      anotherCategory,
    ]);

    rulesServiceMock.ensureNameIsAvailable.mockImplementation(
      (existingCategory: CategoryEntity | null, categoryId?: string) => {
        if (existingCategory && existingCategory.id !== categoryId) {
          throw new ConflictException(
            'A category with this name already exists',
          );
        }
      },
    );

    await expect(
      service.update('category-1', {
        name: 'Painting',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(categoriesRepositoryMock.save).not.toHaveBeenCalled();
  });

  // No desactivar una categoría que ya está inactiva.
  it('throws ConflictException when deactivating an already inactive category', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      isActive: false,
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);

    rulesServiceMock.ensureCategoryIsActive.mockImplementation(
      (item: unknown) => {
        const category = item as CategoryEntity;
        if (!category.isActive) {
          throw new ConflictException('This category is already inactive');
        }
      },
    );

    await expect(service.deactivate('category-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(servicesRepositoryMock.count).not.toHaveBeenCalled();
    expect(categoriesRepositoryMock.save).not.toHaveBeenCalled();
  });

  // No desactivar si existen servicios activos en la categoría.
  it('throws ConflictException when the category has active services', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      isActive: true,
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);
    servicesRepositoryMock.count.mockResolvedValue(2);

    rulesServiceMock.ensureCategoryIsActive.mockImplementation(() => {});
    rulesServiceMock.ensureCategoryHasNoActiveServices.mockImplementation(
      (...args: unknown[]) => {
        const hasActiveServices = args[0] === true;
        if (hasActiveServices) {
          throw new ConflictException(
            'Cannot deactivate a category with active services',
          );
        }
      },
    );

    await expect(service.deactivate('category-1')).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(servicesRepositoryMock.count).toHaveBeenCalledWith({
      where: {
        category: { id: 'category-1' },
        isActive: true,
      },
    });

    expect(
      rulesServiceMock.ensureCategoryHasNoActiveServices,
    ).toHaveBeenCalledWith(true);

    expect(categoriesRepositoryMock.save).not.toHaveBeenCalled();
  });

  // Desactivar correctamente una categoría sin servicios activos.
  it('deactivates a category when it has no active services', async () => {
    const category = {
      id: 'category-1',
      name: 'Plumbing',
      isActive: true,
      services: [],
    } as unknown as CategoryEntity;

    categoriesRepositoryMock.findOne.mockResolvedValue(category);
    servicesRepositoryMock.count.mockResolvedValue(0);

    rulesServiceMock.ensureCategoryIsActive.mockImplementation(() => {});
    rulesServiceMock.ensureCategoryHasNoActiveServices.mockImplementation(
      () => {},
    );

    categoriesRepositoryMock.save.mockImplementation(async (entity) => entity);

    const result = await service.deactivate('category-1');

    expect(servicesRepositoryMock.count).toHaveBeenCalledWith({
      where: {
        category: { id: 'category-1' },
        isActive: true,
      },
    });

    expect(
      rulesServiceMock.ensureCategoryHasNoActiveServices,
    ).toHaveBeenCalledWith(false);

    expect(category.isActive).toBe(false);
    expect(categoriesRepositoryMock.save).toHaveBeenCalledWith(category);

    expect(result).toEqual({
      message: 'Category deactivated successfully',
    });
  });
});

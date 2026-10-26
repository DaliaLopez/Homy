import { describe, beforeEach, it, expect } from '@jest/globals';
import { ConflictException } from '@nestjs/common';

import { CategoriesRulesService } from './categories-rules.service';
import { CategoryEntity } from '../entities/category.entity';

describe('CategoriesRulesService', () => {
  let rulesService: CategoriesRulesService;

  beforeEach(() => {
    rulesService = new CategoriesRulesService();
  });

  it('does not throw when the category name is available', () => {
    expect(() => rulesService.ensureNameIsAvailable(null)).not.toThrow();
  });

  it('throws ConflictException when the category name already exists', () => {
    const existingCategory = {
      id: 'category-1',
      name: 'Plumbing',
    } as CategoryEntity;

    expect(() => rulesService.ensureNameIsAvailable(existingCategory)).toThrow(
      ConflictException,
    );

    expect(() => rulesService.ensureNameIsAvailable(existingCategory)).toThrow(
      'A category with this name already exists',
    );
  });

  it('does not throw when the existing category has the same id', () => {
    const existingCategory = {
      id: 'category-1',
      name: 'Plumbing',
    } as CategoryEntity;

    expect(() =>
      rulesService.ensureNameIsAvailable(existingCategory, 'category-1'),
    ).not.toThrow();
  });

  it('throws ConflictException when another category uses the name', () => {
    const existingCategory = {
      id: 'category-2',
      name: 'Plumbing',
    } as CategoryEntity;

    expect(() =>
      rulesService.ensureNameIsAvailable(existingCategory, 'category-1'),
    ).toThrow(ConflictException);

    expect(() =>
      rulesService.ensureNameIsAvailable(existingCategory, 'category-1'),
    ).toThrow('A category with this name already exists');
  });

  it('does not throw when the category is active', () => {
    const category = {
      id: 'category-1',
      isActive: true,
    } as CategoryEntity;

    expect(() => rulesService.ensureCategoryIsActive(category)).not.toThrow();
  });

  it('throws ConflictException when the category is already inactive', () => {
    const category = {
      id: 'category-1',
      isActive: false,
    } as CategoryEntity;

    expect(() => rulesService.ensureCategoryIsActive(category)).toThrow(
      ConflictException,
    );

    expect(() => rulesService.ensureCategoryIsActive(category)).toThrow(
      'This category is already inactive',
    );
  });

  it('does not throw when the category has no active services', () => {
    expect(() =>
      rulesService.ensureCategoryHasNoActiveServices(false),
    ).not.toThrow();
  });

  it('throws ConflictException when the category has active services', () => {
    expect(() => rulesService.ensureCategoryHasNoActiveServices(true)).toThrow(
      ConflictException,
    );

    expect(() => rulesService.ensureCategoryHasNoActiveServices(true)).toThrow(
      'Cannot deactivate a category with active services',
    );
  });
});

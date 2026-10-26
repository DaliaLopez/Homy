import { ConflictException, Injectable } from '@nestjs/common';

import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoriesRulesService {
  ensureNameIsAvailable(
    existingCategory: CategoryEntity | null,
    categoryId?: string,
  ): void {
    if (existingCategory && existingCategory.id !== categoryId) {
      throw new ConflictException('A category with this name already exists');
    }
  }

  ensureCategoryIsActive(category: CategoryEntity): void {
    if (!category.isActive) {
      throw new ConflictException('This category is already inactive');
    }
  }

  ensureCategoryHasNoActiveServices(hasActiveServices: boolean): void {
    if (hasActiveServices) {
      throw new ConflictException(
        'Cannot deactivate a category with active services',
      );
    }
  }
}

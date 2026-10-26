import { ConflictException, Injectable } from '@nestjs/common';

import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoriesRulesService {
  // Verifica que el nombre no esté utilizado por otra categoría.
  ensureNameIsAvailable(
    existingCategory: CategoryEntity | null,
    categoryId?: string,
  ): void {
    if (existingCategory && existingCategory.id !== categoryId) {
      throw new ConflictException('A category with this name already exists');
    }
  }

  // Impide desactivar una categoría que ya está inactiva.
  ensureCategoryIsActive(category: CategoryEntity): void {
    if (!category.isActive) {
      throw new ConflictException('This category is already inactive');
    }
  }

  // Una categoría no se puede desactivar si tiene servicios activos.
  ensureCategoryHasNoActiveServices(hasActiveServices: boolean): void {
    if (hasActiveServices) {
      throw new ConflictException(
        'Cannot deactivate a category with active services',
      );
    }
  }
}

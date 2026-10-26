import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryEntity } from './entities/category.entity';
import { ServiceEntity } from '../services/entities/service.entity';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesRulesService } from './categories-rules/categories-rules.service';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, ServiceEntity])],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRulesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

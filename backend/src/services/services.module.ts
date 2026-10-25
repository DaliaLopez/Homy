import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRulesService } from './services-rules/services-rules.service';

import { ServiceEntity } from './entities/service.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { RequestEntity } from '../requests/entities/request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceEntity,
      CategoryEntity,
      WorkerProfileEntity,
      RequestEntity,
    ]),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRulesService],
  exports: [ServicesService],
})
export class ServicesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityRulesService } from './availability-rules/availability-rules.service';

import { AvailabilityEntity } from './entities/availability.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { ServiceEntity } from '../services/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilityEntity,
      WorkerEntity,
      RequestEntity,
      ServiceEntity,
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRulesService],

  // Permite que RequestsModule use AvailabilityService.
  exports: [AvailabilityService],
})
export class AvailabilityModule {}

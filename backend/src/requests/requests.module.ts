import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsRulesService } from './request-rules/request-rules.service';
import { RequestEntity } from './entities/request.entity';

import { AuthModule } from '../auth/auth.module';

import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity]),
    AuthModule,
    AvailabilityModule,
  ],
  providers: [RequestsService, RequestsRulesService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}

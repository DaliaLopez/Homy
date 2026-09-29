import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestRulesService } from './request-rules/request-rules.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from './entities/request.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([
      RequestEntity,
      UserEntity,
      WorkerEntity,
      ServiceEntity,
    ]),
  ],
  providers: [RequestsService, RequestRulesService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}

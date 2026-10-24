import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsRulesService } from './request-rules/request-rules.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from './entities/request.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequestEntity]),
    AuthModule, 
  ],
  providers: [RequestsService, RequestsRulesService],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}

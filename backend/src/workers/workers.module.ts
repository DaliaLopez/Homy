import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from '../users/entities/user.entity';
import { WorkerEntity } from './entities/worker.entity';
import { WorkersRulesService } from './worker-rules/workers-rules.service';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkerEntity, UserEntity]), AuthModule],
  providers: [WorkersService, WorkersRulesService],
  controllers: [WorkersController],
  exports: [WorkersService],
})
export class WorkersModule {}

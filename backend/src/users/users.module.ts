import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRulesService } from './user-rules/user-rules.service';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from '../requests/entities/request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RequestEntity])],
  providers: [UsersService, UserRulesService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}

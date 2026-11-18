import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WorkersModule } from '../workers/workers.module';
import { VerificationEntity } from './entities/verification.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { VerificationsRulesService } from './verification-rules/verifications-rules.service';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationEntity, CategoryEntity, UserEntity]),
    AuthModule,
    WorkersModule,
  ],
  providers: [VerificationsService, VerificationsRulesService],
  controllers: [VerificationsController],
  exports: [VerificationsService],
})
export class VerificationsModule {}

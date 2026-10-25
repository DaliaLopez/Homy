import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WorkersModule } from '../workers/workers.module';
import { VerificationEntity } from './entities/verification.entity';
import { VerificationsRulesService } from './verification-rules/verifications-rules.service';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationEntity]),
    AuthModule,
    WorkersModule,
  ],
  providers: [VerificationsService, VerificationsRulesService],
  controllers: [VerificationsController],
  exports: [VerificationsService],
})
export class VerificationsModule {}

import { Module } from '@nestjs/common';
import { VerificationsService } from './verifications.service';
import { VerificationsController } from './verifications.controller';

@Module({
  providers: [VerificationsService],
  controllers: [VerificationsController]
})
export class VerificationsModule {}

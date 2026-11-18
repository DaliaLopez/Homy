import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportEntity } from './entities/report.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ReportsRulesService } from './report-rules/reports-rules.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity, RequestEntity, ServiceEntity]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRulesService],
  exports: [ReportsService],
})
export class ReportsModule {}

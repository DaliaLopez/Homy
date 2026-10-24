import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportEntity } from './entities/report.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ReportsRulesService } from './report-rules/reports-rules.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity]),
    AuthModule, 
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRulesService],
  exports: [ReportsService],
})
export class ReportsModule {}

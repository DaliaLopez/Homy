import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportEntity } from './entities/report.entity';
import { ReportStatus } from './enums/report-status.enum';
import { ReportsRulesService } from './report-rules/reports-rules.service';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(ReportEntity)
        private readonly reportsRepository: Repository<ReportEntity>,
        private readonly reportsRulesService: ReportsRulesService,
    ) { }

    async create(reporterId: string, dto: CreateReportDto): Promise<ReportEntity> {
        const report = this.reportsRepository.create({
            reason: dto.reason,
            description: dto.description,
            reportedUserId: dto.reportedUserId,
            requestId: dto.requestId,
            status: ReportStatus.PENDING,
            reporter: { id: reporterId } as UserEntity,
        });

        return this.reportsRepository.save(report);
    }

    findAllByReporter(reporterId: string): Promise<ReportEntity[]> {
        return this.reportsRepository.find({
            where: { reporter: { id: reporterId } },
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<ReportEntity> {
        const report = await this.reportsRepository.findOne({
            where: { id },
            relations: ['reporter'],
        });

        if (!report) {
            throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
        }

        return report;
    }

    async updateStatus(id: string, dto: UpdateReportStatusDto): Promise<ReportEntity> {
        const report = await this.findOne(id);

        this.reportsRulesService.ensureCanBeUpdated(report, dto.status);

        report.status = dto.status;
        return this.reportsRepository.save(report);
    }
}
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { withoutData } from '../common/stored-file';
import { RequestEntity } from '../requests/entities/request.entity';
import { ServiceEntity } from '../services/entities/service.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateReportDto, RespondReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportEntity } from './entities/report.entity';
import { ReportStatus } from './enums/report-status.enum';
import { ReportsRulesService } from './report-rules/reports-rules.service';

const PERSON = { id: true, name: true, role: true, avatarUrl: true } as const;

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
    private readonly reportsRulesService: ReportsRulesService,
  ) {}

  async create(
    reporterId: string,
    dto: CreateReportDto,
  ): Promise<ReportEntity> {
    if (reporterId === dto.reportedUserId) {
      throw new BadRequestException('You cannot report yourself.');
    }

    const report = this.reportsRepository.create({
      reason: dto.reason,
      description: dto.description,
      reportedUserId: dto.reportedUserId,
      requestId: dto.requestId,
      status: ReportStatus.PENDING,
      evidence: dto.evidence ?? [],
      reporter: { id: reporterId } as UserEntity,
    });

    try {
      return await this.reportsRepository.save(report);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23503'
      ) {
        throw new NotFoundException('The reported user does not exist.');
      }
      throw error;
    }
  }

  /** Agrega el nombre del servicio y la fecha de la solicitud relacionada. */
  private async enrich(reports: ReportEntity[], keepFiles: boolean) {
    const requestIds = [...new Set(reports.map((report) => report.requestId))];
    const requests = requestIds.length
      ? await this.requestsRepository.findBy({ id: In(requestIds) })
      : [];
    const serviceIds = [
      ...new Set(requests.map((request) => request.serviceId)),
    ];
    const services = serviceIds.length
      ? await this.servicesRepository.findBy({ id: In(serviceIds) })
      : [];

    return reports.map((report) => {
      const request = requests.find((item) => item.id === report.requestId);
      const service = services.find((item) => item.id === request?.serviceId);
      return {
        ...report,
        evidence: keepFiles ? report.evidence : withoutData(report.evidence),
        responseEvidence: keepFiles
          ? report.responseEvidence
          : withoutData(report.responseEvidence),
        request: request
          ? {
              id: request.id,
              scheduledAt: request.scheduledAt,
              serviceName: service?.name ?? null,
            }
          : null,
      };
    });
  }

  private find(where: object) {
    return this.reportsRepository.find({
      where,
      relations: { reporter: true, reportedUser: true },
      select: {
        reporter: PERSON,
        reportedUser: PERSON,
      } as never,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByReporter(reporterId: string) {
    return this.enrich(
      await this.find({ reporter: { id: reporterId } }),
      false,
    );
  }

  async findAllReceived(userId: string) {
    return this.enrich(await this.find({ reportedUserId: userId }), true);
  }

  async findAll() {
    return this.enrich(await this.find({}), false);
  }

  async findOne(id: string): Promise<ReportEntity> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: { reporter: true, reportedUser: true },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  /** Detalle completo: lo ve el administrador y las dos personas involucradas. */
  async findOneFor(id: string, user: { id: string; role: string }) {
    const report = await this.findOne(id);
    const involved =
      report.reporter?.id === user.id || report.reportedUserId === user.id;
    if (user.role !== 'admin' && !involved) {
      throw new ForbiddenException('You do not have access to this report.');
    }
    const [detail] = await this.enrich([report], true);
    return detail;
  }

  async respond(id: string, userId: string, dto: RespondReportDto) {
    const report = await this.findOne(id);
    this.reportsRulesService.ensureCanRespond(report, userId);

    report.response = dto.response.trim();
    report.responseEvidence = dto.evidence ?? [];
    report.respondedAt = new Date();
    if (report.status === ReportStatus.PENDING) {
      report.status = ReportStatus.INVESTIGATING;
    }
    return this.reportsRepository.save(report);
  }

  async updateStatus(
    id: string,
    dto: UpdateReportStatusDto,
  ): Promise<ReportEntity> {
    const report = await this.findOne(id);

    this.reportsRulesService.ensureCanBeUpdated(report, dto.status);

    report.status = dto.status;
    if (
      dto.status === ReportStatus.RESOLVED ||
      dto.status === ReportStatus.DISMISSED
    ) {
      report.resolutionActions = dto.actions?.trim() || null;
      report.resolution = dto.resolution?.trim() || null;
      report.closedAt = new Date();
    }
    return this.reportsRepository.save(report);
  }
}

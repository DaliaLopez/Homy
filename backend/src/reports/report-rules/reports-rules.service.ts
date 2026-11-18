import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ReportEntity } from '../entities/report.entity';
import { ReportStatus } from '../enums/report-status.enum';

const TERMINAL = [ReportStatus.RESOLVED, ReportStatus.DISMISSED];

@Injectable()
export class ReportsRulesService {
  /** El administrador puede decidir en cualquier momento mientras el caso esté abierto. */
  ensureCanBeUpdated(report: ReportEntity, newStatus: ReportStatus): void {
    if (TERMINAL.includes(report.status)) {
      throw new ConflictException(
        `The report is in a terminal state (${report.status}) and cannot be updated.`,
      );
    }
    if (newStatus === ReportStatus.PENDING) {
      throw new ConflictException('A report cannot go back to pending.');
    }
  }

  ensureCanRespond(report: ReportEntity, userId: string): void {
    if (report.reportedUserId !== userId) {
      throw new ForbiddenException(
        'Only the reported user can answer this report.',
      );
    }
    if (TERMINAL.includes(report.status)) {
      throw new ConflictException('The report is already closed.');
    }
    if (report.response) {
      throw new ConflictException('You already sent your version.');
    }
  }
}

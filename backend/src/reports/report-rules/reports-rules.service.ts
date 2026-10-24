import { ConflictException, Injectable } from '@nestjs/common';
import { ReportEntity } from '../entities/report.entity';
import { ReportStatus } from '../enums/report-status.enum';

@Injectable()
export class ReportsRulesService {
    ensureCanBeUpdated(report: ReportEntity, newStatus: ReportStatus): void {
        const terminalStates = [ReportStatus.RESOLVED, ReportStatus.DISMISSED];

        if (terminalStates.includes(report.status)) {
            throw new ConflictException(`The report is in a terminal state (${report.status}) and cannot be updated.`);
        }

        if (newStatus === ReportStatus.RESOLVED && report.status !== ReportStatus.INVESTIGATING) {
            throw new ConflictException('The report must be in "investigating" state before being marked as resolved.');
        }
    }
}
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ReportStatus } from '../enums/report-status.enum';

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  actions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReportDto, RespondReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';
import { AdminGuard } from '../auth/guards/admin.guard';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: CreateReportDto,
  ) {
    return this.reportsService.create(req.user.id, dto);
  }

  @Get()
  findAllMyReports(@Req() req: { user: { id: string } }) {
    return this.reportsService.findAllByReporter(req.user.id);
  }

  @Get('received')
  findReceived(@Req() req: { user: { id: string } }) {
    return this.reportsService.findAllReceived(req.user.id);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string; role: string } },
  ) {
    return this.reportsService.findOneFor(id, req.user);
  }

  @Patch(':id/response')
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: RespondReportDto,
  ) {
    return this.reportsService.respond(id, req.user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(id, dto);
  }
}

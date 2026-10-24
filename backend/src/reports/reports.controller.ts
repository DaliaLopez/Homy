import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { ReportsService } from './reports.service';

const requestValidationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
});

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post()
    create(
        @Req() req: { user: { id: string } },
        @Body(requestValidationPipe) dto: CreateReportDto
    ) {
        return this.reportsService.create(req.user.id, dto);
    }

    @Get()
    findAllMyReports(@Req() req: { user: { id: string } }) {
        return this.reportsService.findAllByReporter(req.user.id);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.reportsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body(requestValidationPipe) dto: UpdateReportStatusDto,
    ) {
        return this.reportsService.updateStatus(id, dto);
    }
}
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ReviewServiceDto } from './dto/review-service.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
import { ServicesService } from './services.service';

const serviceValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  create(
    @Req() req: { user: { id: string } },
    @Body(serviceValidationPipe) dto: CreateServiceDto,
  ) {
    return this.servicesService.create(req.user.id, dto);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  findMine(@Req() req: { user: { id: string } }) {
    return this.servicesService.findMine(req.user.id);
  }

  @Get('worker/:workerId')
  findByWorker(@Param('workerId', ParseUUIDPipe) workerId: string) {
    return this.servicesService.findPublishedByWorker(workerId);
  }

  @Get('review')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findForReview(@Query('status') status?: string) {
    return this.servicesService.findForReview(status);
  }

  @Get('review/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOneForReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOneForReview(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, AdminGuard)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(serviceValidationPipe) dto: ReviewServiceDto,
  ) {
    return this.servicesService.review(id, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  update(
    @Req() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(serviceValidationPipe) dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  remove(
    @Req() req: { user: { id: string } },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.servicesService.remove(id, req.user.id);
  }
}

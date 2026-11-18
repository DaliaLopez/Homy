import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
  ValidationPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';

import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

type AuthenticatedRequest = { user: { id: string } };

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  create(
    @Request() req: AuthenticatedRequest,
    @Body(requestValidationPipe) createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(req.user.id, createAvailabilityDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  findAll(@Request() req: AuthenticatedRequest) {
    return this.availabilityService.findAll(req.user.id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  findMine(@Request() req: AuthenticatedRequest) {
    return this.availabilityService.findAll(req.user.id);
  }

  // Públicos: el perfil del profesional y la contratación muestran sus horarios.
  @Get('worker/:workerId')
  findByWorker(@Param('workerId', ParseUUIDPipe) workerId: string) {
    return this.availabilityService.findByWorker(workerId);
  }

  @Get('worker/:workerId/slots')
  findSlots(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @Query('date') date: string,
    @Query('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    return this.availabilityService.getFreeSlots(workerId, date, serviceId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.availabilityService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(
      req.user.id,
      id,
      updateAvailabilityDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('worker')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.availabilityService.remove(req.user.id, id);
  }
}

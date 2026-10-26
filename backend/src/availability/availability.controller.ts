/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
} from '@nestjs/common';

import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Crear una disponibilidad para el trabajador autenticado
  @Post()
  create(
    @Request() req: any,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(req.user.id, createAvailabilityDto);
  }

  // Consultar todas las disponibilidades
  @Get()
  findAll(@Request() req: any) {
    return this.availabilityService.findAll(req.user.id);
  }

  // Consultar las disponibilidades del trabajador autenticado
  @Get('mine')
  findMine(@Request() req: any) {
    return this.availabilityService.findAll(req.user.id);
  }

  // Consultar una disponibilidad por su ID
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.availabilityService.findOne(id, req.user.id);
  }

  // Actualizar una disponibilidad
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(
      id,
      req.user.id,
      updateAvailabilityDto,
    );
  }

  // Eliminar una disponibilidad
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.availabilityService.remove(id, req.user.id);
  }
}

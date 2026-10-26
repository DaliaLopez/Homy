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
} from '@nestjs/common';

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
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) { }

  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body(requestValidationPipe) createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(req.user.id, createAvailabilityDto);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.availabilityService.findAll(req.user.id);
  }

  @Get('mine')
  findMine(@Request() req: AuthenticatedRequest) {
    return this.availabilityService.findAll(req.user.id);
  }

  @Get('worker/:workerId')
  findByWorker(@Param('workerId', ParseUUIDPipe) workerId: string) {
    return this.availabilityService.findByWorker(workerId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.availabilityService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(requestValidationPipe) updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.availabilityService.update(
      req.user.id,
      id,
      updateAvailabilityDto
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.availabilityService.remove(req.user.id, id);
  }
}

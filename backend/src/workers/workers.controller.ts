import {
  Body,
  Controller,
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
import { CreateWorkerDto } from './dto/create-worker.dto';
import { FindWorkersQueryDto } from './dto/find-workers-query.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkersService } from './workers.service';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  // Lectura pública: el catálogo de trabajadores se puede ver sin iniciar sesión
  @Get()
  findAll(@Query(requestValidationPipe) query: FindWorkersQueryDto) {
    return this.workersService.findAll(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: { user: { id: string } }) {
    return this.workersService.findMine(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: CreateWorkerDto,
  ) {
    return this.workersService.create(req.user.id, dto);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMine(
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: UpdateWorkerDto,
  ) {
    return this.workersService.updateMine(req.user.id, dto);
  }
}

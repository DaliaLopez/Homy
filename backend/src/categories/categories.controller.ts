import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

const categoryValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body(categoryValidationPipe) dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // Público: el inicio del cliente y el registro muestran las categorías activas.
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllForAdmin() {
    return this.categoriesService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(categoryValidationPipe) dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.deactivate(id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.activate(id);
  }
}

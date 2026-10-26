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
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FindVerificationsQueryDto } from './dto/find-verifications-query.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { VerificationsService } from './verifications.service';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('verifications')
@UseGuards(JwtAuthGuard)
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Post()
  request(@Req() req: { user: { id: string } }) {
    return this.verificationsService.request(req.user.id);
  }

  @Get('me')
  findMine(@Req() req: { user: { id: string } }) {
    return this.verificationsService.findMine(req.user.id);
  }
  
  @Get()
  @UseGuards(AdminGuard)
  findAll(@Query(requestValidationPipe) query: FindVerificationsQueryDto) {
    return this.verificationsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.verificationsService.findOne(id);
  }

  @Patch(':id/review')
  @UseGuards(AdminGuard)
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: ReviewVerificationDto,
  ) {
    return this.verificationsService.review(id, req.user.id, dto);
  }
}

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
import {
  CreateVerificationDto,
  ResubmitVerificationDto,
} from './dto/create-verification.dto';
import { Roles, RolesGuard } from '../auth/guards/roles.guard';
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
  @UseGuards(RolesGuard)
  @Roles('worker')
  request(
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: CreateVerificationDto,
  ) {
    return this.verificationsService.request(req.user.id, dto);
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles('worker')
  findMine(@Req() req: { user: { id: string } }) {
    return this.verificationsService.findMine(req.user.id);
  }

  @Patch(':id/resubmit')
  @UseGuards(RolesGuard)
  @Roles('worker')
  resubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: ResubmitVerificationDto,
  ) {
    return this.verificationsService.resubmit(id, req.user.id, dto);
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

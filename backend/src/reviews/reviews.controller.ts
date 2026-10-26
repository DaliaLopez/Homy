import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Req() req: { user: { id: string } },
    @Body(requestValidationPipe) dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get('received')
  @UseGuards(JwtAuthGuard)
  findReceived(@Req() req: { user: { id: string } }) {
    return this.reviewsService.findReceived(req.user.id);
  }

  @Get('worker/:workerId')
  findByWorker(@Param('workerId', ParseUUIDPipe) workerId: string) {
    return this.reviewsService.findByWorker(workerId);
  }
}

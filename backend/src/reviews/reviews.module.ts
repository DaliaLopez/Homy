import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RequestEntity } from '../requests/entities/request.entity';
import { WorkersModule } from '../workers/workers.module';
import { ReviewEntity } from './entities/review.entity';
import { ReviewsRulesService } from './review-rules/reviews-rules.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewEntity, RequestEntity]),
    AuthModule,
    WorkersModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRulesService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

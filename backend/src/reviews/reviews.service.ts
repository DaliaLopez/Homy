import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { RequestEntity } from '../requests/entities/request.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { WorkersService } from '../workers/workers.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entities/review.entity';
import { ReviewsRulesService } from './review-rules/reviews-rules.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepository: Repository<ReviewEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    private readonly workersService: WorkersService,
    private readonly reviewsRulesService: ReviewsRulesService,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<ReviewEntity> {
    const request = await this.requestsRepository.findOne({
      where: { id: dto.requestId },
      relations: { client: true },
    });

    if (!request) {
      throw new NotFoundException(
        `Request with ID ${dto.requestId} not found.`,
      );
    }

    this.reviewsRulesService.ensureCanBeReviewed(request, userId);

    const alreadyReviewed = await this.reviewsRepository.exists({
      where: { request: { id: request.id } },
    });
    this.reviewsRulesService.ensureNotAlreadyReviewed(alreadyReviewed);

    // RequestEntity.workerId debe ser el id del perfil profesional (worker_profiles.id)
    const worker = await this.workersService.findOne(request.workerId);

    const review = this.reviewsRepository.create({
      rating: dto.rating,
      comment: dto.comment ?? null,
      user: { id: userId } as UserEntity,
      worker: { id: worker.id } as WorkerEntity,
      request: { id: request.id } as RequestEntity,
    });

    let saved: ReviewEntity;
    try {
      saved = await this.reviewsRepository.save(review);
    } catch (error) {
      // Dos reseñas simultáneas de la misma solicitud: la restricción única lo detiene
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('This service has already been reviewed.');
      }
      throw error;
    }

    await this.refreshWorkerRating(worker.id);
    return saved;
  }

  async findByWorker(workerId: string): Promise<ReviewEntity[]> {
    await this.workersService.findOne(workerId);

    return this.reviewsRepository.find({
      where: { worker: { id: workerId } },
      relations: { user: true },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { id: true, name: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  // Reseñas que recibió el trabajador autenticado (HU13)
  async findReceived(userId: string): Promise<ReviewEntity[]> {
    const worker = await this.workersService.findMine(userId);
    return this.findByWorker(worker.id);
  }

  private async refreshWorkerRating(workerId: string): Promise<void> {
    const ratings = await this.reviewsRepository.find({
      where: { worker: { id: workerId } },
      select: { id: true, rating: true },
    });

    const average =
      ratings.length === 0
        ? 0
        : Math.round(
            (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) *
              100,
          ) / 100;

    await this.workersService.updateAverageRating(workerId, average);
  }
}

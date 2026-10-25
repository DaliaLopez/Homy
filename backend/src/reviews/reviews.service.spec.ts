import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewEntity } from './entities/review.entity';
import { ReviewsRulesService } from './review-rules/reviews-rules.service';
import { RequestEntity } from '../requests/entities/request.entity';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { WorkersService } from '../workers/workers.service';

describe('ReviewsServiceTest', () => {
  let service: ReviewsService;

  const reviewsRepositoryMock = {
    find: jest.fn<(options: any) => Promise<ReviewEntity[]>>(),
    exists: jest.fn<(options: any) => Promise<boolean>>(),
    create: jest.fn<(review: any) => ReviewEntity>(),
    save: jest.fn<(review: ReviewEntity) => Promise<ReviewEntity>>(),
  };

  const requestsRepositoryMock = {
    findOne: jest.fn<(options: any) => Promise<RequestEntity | null>>(),
  };

  const workersServiceMock = {
    findOne: jest.fn<(id: string) => Promise<WorkerEntity>>(),
    findMine: jest.fn<(userId: string) => Promise<WorkerEntity>>(),
    updateAverageRating:
      jest.fn<(workerId: string, average: number) => Promise<void>>(),
  };

  const reviewsRulesServiceMock = {
    ensureCanBeReviewed: jest.fn(),
    ensureNotAlreadyReviewed: jest.fn(),
  };

  const requestMock = {
    id: 'request-1',
    status: RequestStatus.COMPLETED,
    workerId: 'worker-1',
    client: { id: 'user-1' },
  } as unknown as RequestEntity;

  const dto = { requestId: 'request-1', rating: 4, comment: 'Muy puntual' };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: reviewsRepositoryMock,
        },
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: requestsRepositoryMock,
        },
        {
          provide: WorkersService,
          useValue: workersServiceMock,
        },
        {
          provide: ReviewsRulesService,
          useValue: reviewsRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(ReviewsService);
  });

  it('throws NotFoundException when the request does not exist', async () => {
    requestsRepositoryMock.findOne.mockResolvedValue(null);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(reviewsRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('does not save the review when the rules reject the user', async () => {
    requestsRepositoryMock.findOne.mockResolvedValue(requestMock);
    reviewsRulesServiceMock.ensureCanBeReviewed.mockImplementationOnce(() => {
      throw new ForbiddenException();
    });

    await expect(service.create('user-2', dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(reviewsRulesServiceMock.ensureCanBeReviewed).toHaveBeenCalledWith(
      requestMock,
      'user-2',
    );
    expect(reviewsRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('does not save the review when the request was already reviewed', async () => {
    requestsRepositoryMock.findOne.mockResolvedValue(requestMock);
    reviewsRepositoryMock.exists.mockResolvedValue(true);
    reviewsRulesServiceMock.ensureNotAlreadyReviewed.mockImplementationOnce(
      () => {
        throw new ConflictException();
      },
    );

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(
      reviewsRulesServiceMock.ensureNotAlreadyReviewed,
    ).toHaveBeenCalledWith(true);
    expect(reviewsRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('creates the review and recalculates the worker average rating', async () => {
    const createdReview = { rating: 4 } as ReviewEntity;
    const savedReview = { ...createdReview, id: 'review-1' };

    requestsRepositoryMock.findOne.mockResolvedValue(requestMock);
    reviewsRepositoryMock.exists.mockResolvedValue(false);
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    reviewsRepositoryMock.create.mockReturnValue(createdReview);
    reviewsRepositoryMock.save.mockResolvedValue(savedReview);
    reviewsRepositoryMock.find.mockResolvedValue([
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
    ] as ReviewEntity[]);

    const result = await service.create('user-1', dto);

    expect(workersServiceMock.findOne).toHaveBeenCalledWith('worker-1');
    expect(reviewsRepositoryMock.create).toHaveBeenCalledWith({
      rating: 4,
      comment: 'Muy puntual',
      user: { id: 'user-1' },
      worker: { id: 'worker-1' },
      request: { id: 'request-1' },
    });
    expect(reviewsRepositoryMock.save).toHaveBeenCalledWith(createdReview);
    expect(workersServiceMock.updateAverageRating).toHaveBeenCalledWith(
      'worker-1',
      4.33,
    );
    expect(result.id).toEqual('review-1');
  });

  it('stores a null comment when none is sent', async () => {
    requestsRepositoryMock.findOne.mockResolvedValue(requestMock);
    reviewsRepositoryMock.exists.mockResolvedValue(false);
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    reviewsRepositoryMock.create.mockReturnValue({} as ReviewEntity);
    reviewsRepositoryMock.save.mockResolvedValue({} as ReviewEntity);
    reviewsRepositoryMock.find.mockResolvedValue([
      { rating: 5 },
    ] as ReviewEntity[]);

    await service.create('user-1', { requestId: 'request-1', rating: 5 });

    expect(reviewsRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ comment: null }),
    );
  });

  it('throws ConflictException when two reviews collide on the unique constraint', async () => {
    requestsRepositoryMock.findOne.mockResolvedValue(requestMock);
    reviewsRepositoryMock.exists.mockResolvedValue(false);
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    reviewsRepositoryMock.create.mockReturnValue({} as ReviewEntity);

    const error = Object.assign(
      new QueryFailedError('query', [], new Error('Driver Error')),
      { driverError: { code: '23505' } },
    );
    reviewsRepositoryMock.save.mockRejectedValue(error);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(workersServiceMock.updateAverageRating).not.toHaveBeenCalled();
  });

  it('rethrows unexpected database errors', async () => {
    requestsRepositoryMock.findOne.mockResolvedValue(requestMock);
    reviewsRepositoryMock.exists.mockResolvedValue(false);
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    reviewsRepositoryMock.create.mockReturnValue({} as ReviewEntity);
    reviewsRepositoryMock.save.mockRejectedValue(new Error('db down'));

    await expect(service.create('user-1', dto)).rejects.toThrow('db down');
  });

  it('returns the reviews of a worker after checking that it exists', async () => {
    const reviewsMock = [{ id: 'review-1', rating: 5 }] as ReviewEntity[];
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    reviewsRepositoryMock.find.mockResolvedValue(reviewsMock);

    const result = await service.findByWorker('worker-1');

    expect(workersServiceMock.findOne).toHaveBeenCalledWith('worker-1');
    expect(reviewsRepositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { worker: { id: 'worker-1' } } }),
    );
    expect(result).toEqual(reviewsMock);
  });

  it('throws NotFoundException when the worker of the reviews does not exist', async () => {
    workersServiceMock.findOne.mockRejectedValue(new NotFoundException());

    await expect(service.findByWorker('worker-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(reviewsRepositoryMock.find).not.toHaveBeenCalled();
  });

  it('returns the reviews received by the authenticated worker', async () => {
    workersServiceMock.findMine.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    workersServiceMock.findOne.mockResolvedValue({
      id: 'worker-1',
    } as WorkerEntity);
    reviewsRepositoryMock.find.mockResolvedValue([]);

    await service.findReceived('user-1');

    expect(workersServiceMock.findMine).toHaveBeenCalledWith('user-1');
    expect(reviewsRepositoryMock.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { worker: { id: 'worker-1' } } }),
    );
  });
});

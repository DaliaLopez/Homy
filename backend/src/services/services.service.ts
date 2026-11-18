import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ServiceEntity } from './entities/service.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';

import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ReviewServiceDto } from './dto/review-service.dto';
import { VerificationStatus } from '../verifications/enums/verification-status.enum';
import { ServicesRulesService } from './services-rules/services-rules.service';

import { RequestStatus } from '../requests/enums/request-status.enum';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,

    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,

    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,

    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,

    private readonly servicesRulesService: ServicesRulesService,
  ) {}

  async create(userId: string, dto: CreateServiceDto): Promise<ServiceEntity> {
    const category = await this.categoriesRepository.findOneBy({
      id: dto.categoryId,
    });

    if (!category) {
      throw new NotFoundException(
        `Category with id ${dto.categoryId} was not found`,
      );
    }

    if (!category.isActive) {
      throw new ConflictException(
        'Cannot create a service in an inactive category',
      );
    }

    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    this.ensureCanPublishIn(worker, category.id);

    const service = this.servicesRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,

      durationMinutes: dto.durationMinutes,

      category,
      worker,
      isActive: true,
      // Todo servicio nuevo lo revisa un administrador antes de mostrarse.
      status: 'in_review',
      reviewNote: null,
      submittedAt: new Date(),
    });

    return this.servicesRepository.save(service);
  }

  /** Solo puede publicar si está verificado y la categoría fue aprobada. */
  private ensureCanPublishIn(worker: WorkerEntity, categoryId: string): void {
    if (worker.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Your profile must be verified before publishing services.',
      );
    }
    const approved = worker.approvedCategories ?? [];
    if (!approved.some((category) => category.id === categoryId)) {
      throw new ForbiddenException(
        'You can only publish services in your verified categories.',
      );
    }
  }

  private async findWorkerByUser(userId: string): Promise<WorkerEntity> {
    const worker = await this.workersRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }
    return worker;
  }

  async findMine(userId: string): Promise<ServiceEntity[]> {
    const worker = await this.findWorkerByUser(userId);
    return this.servicesRepository.find({
      where: { worker: { id: worker.id } },
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });
  }

  findPublishedByWorker(workerId: string): Promise<ServiceEntity[]> {
    return this.servicesRepository.find({
      where: { worker: { id: workerId }, status: 'published', isActive: true },
      relations: { category: true },
      order: { price: 'ASC' },
    });
  }

  findForReview(status?: string): Promise<ServiceEntity[]> {
    return this.servicesRepository.find({
      where: status ? { status: status as ServiceEntity['status'] } : {},
      relations: { category: true, worker: { user: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForReview(id: string): Promise<ServiceEntity> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: { category: true, worker: { user: true } },
    });
    if (!service) {
      throw new NotFoundException(`Service with id ${id} was not found`);
    }
    return service;
  }

  async review(id: string, dto: ReviewServiceDto): Promise<ServiceEntity> {
    const service = await this.findOneForReview(id);
    if (service.status !== 'in_review') {
      throw new ConflictException('Only services in review can be reviewed.');
    }
    service.status = dto.status;
    service.reviewNote = dto.note?.trim() || null;
    service.reviewedAt = new Date();
    return this.servicesRepository.save(service);
  }

  /** Catálogo público: solo servicios aprobados y activos. */
  findAll(): Promise<ServiceEntity[]> {
    return this.servicesRepository.find({
      where: { status: 'published', isActive: true },
      relations: {
        category: true,
        worker: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<ServiceEntity> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: {
        category: true,
        worker: true,
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with id ${id} was not found`);
    }

    return service;
  }

  private async ensureServiceHasNoActiveRequests(
    serviceId: string,
  ): Promise<void> {
    const requests = await this.requestsRepository.find({
      where: {
        serviceId,
        status: In([
          RequestStatus.REQUESTED,
          RequestStatus.ACCEPTED,
          RequestStatus.IN_PROGRESS,
        ]),
      },
      select: {
        status: true,
      },
    });

    const statuses = requests.map((request) => request.status);

    this.servicesRulesService.ensureHasNoActiveRequests(statuses);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    const service = await this.findOne(id);

    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    this.servicesRulesService.ensureCanBeModified(service, worker.id);

    await this.ensureServiceHasNoActiveRequests(id);

    if (service.status === 'rejected') {
      throw new ConflictException('A rejected service cannot be edited.');
    }

    if (dto.categoryId !== undefined) {
      this.ensureCanPublishIn(worker, dto.categoryId);
      const category = await this.categoriesRepository.findOneBy({
        id: dto.categoryId,
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} was not found`,
        );
      }

      if (!category.isActive) {
        throw new ConflictException(
          'Cannot assign an inactive category to a service',
        );
      }

      service.category = category;
    }

    if (dto.name !== undefined) {
      service.name = dto.name;
    }

    if (dto.description !== undefined) {
      service.description = dto.description;
    }

    if (dto.price !== undefined) {
      service.price = dto.price;
    }

    if (dto.durationMinutes !== undefined) {
      service.durationMinutes = dto.durationMinutes;
    }

    // Cualquier cambio vuelve a pasar por la revisión del administrador.
    service.status = 'in_review';
    service.reviewNote = null;
    service.submittedAt = new Date();

    return this.servicesRepository.save(service);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const service = await this.findOne(id);

    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker profile was not found for this user');
    }

    this.servicesRulesService.ensureCanBeModified(service, worker.id);

    await this.ensureServiceHasNoActiveRequests(id);

    await this.servicesRepository.remove(service);

    return {
      message: 'Service deleted successfully',
    };
  }
}

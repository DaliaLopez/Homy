import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceEntity } from '../services/entities/service.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { ReviewEntity } from '../reviews/entities/review.entity';

import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request.dto';
import { RequestEntity } from './entities/request.entity';
import { RequestStatus } from './enums/request-status.enum';
import {
  RequestActor,
  RequestsRulesService,
} from './request-rules/request-rules.service';
import { UserEntity } from '../users/entities/user.entity';

import { AvailabilityService } from '../availability/availability.service';
import { ServicesService } from '../services/services.service';
import { WorkersService } from '../workers/workers.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewsRepository: Repository<ReviewEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    private readonly requestsRulesService: RequestsRulesService,
    private readonly availabilityService: AvailabilityService,
    private readonly workersService: WorkersService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(
    clientId: string,
    dto: CreateRequestDto,
  ): Promise<RequestEntity> {
    const worker = await this.workersService.findOne(dto.workerId);
    const service = await this.servicesService.findOne(dto.serviceId);
    const scheduledAt = new Date(dto.scheduledAt);

    this.requestsRulesService.ensureCanBeCreated({
      clientId,
      workerUserId: worker.user.id,
      requestedWorkerId: worker.id,
      serviceWorkerId: service.worker.id,
      serviceIsActive: service.isActive,
      scheduledAt,
    });

    // Cliente y trabajador deben estar en la misma ciudad.
    const client = await this.usersRepository.findOneBy({ id: clientId });
    this.requestsRulesService.ensureSameCity(
      client?.location,
      worker.user.location,
      'hire',
    );

    // Se comprueba desde la creación que el horario esté libre y dentro de la disponibilidad.
    await this.availabilityService.ensureRequestFitsAvailability(
      worker.id,
      service.id,
      scheduledAt,
      '',
    );

    const request = this.requestsRepository.create({
      description: dto.description,
      scheduledAt,
      address: dto.address,
      price: Number(service.price),
      workerId: worker.id,
      serviceId: service.id,
      status: RequestStatus.REQUESTED,
      client: { id: clientId } as UserEntity,
    });

    return this.requestsRepository.save(request);
  }

  /**
   * Agrega el servicio, el trabajador y si el cliente ya reseñó, para que las
   * pantallas no tengan que hacer una petición por cada solicitud.
   */
  async enrich(requests: RequestEntity[]) {
    if (requests.length === 0) return [];
    const serviceIds = [...new Set(requests.map((item) => item.serviceId))];
    const workerIds = [...new Set(requests.map((item) => item.workerId))];
    const [services, workers, reviews] = await Promise.all([
      this.servicesRepository.find({
        where: { id: In(serviceIds) },
        relations: { category: true },
      }),
      this.workersRepository.find({
        where: { id: In(workerIds) },
        relations: { user: true },
      }),
      this.reviewsRepository.find({
        where: { request: { id: In(requests.map((item) => item.id)) } },
        relations: { request: true },
      }),
    ]);

    return requests.map((request) => {
      const service = services.find((item) => item.id === request.serviceId);
      const worker = workers.find((item) => item.id === request.workerId);
      const review = reviews.find((item) => item.request.id === request.id);
      return {
        ...request,
        client: request.client
          ? {
              id: request.client.id,
              name: request.client.name,
              phone: request.client.phone,
              location: request.client.location,
              avatarUrl: request.client.avatarUrl,
            }
          : null,
        service: service
          ? {
              id: service.id,
              name: service.name,
              durationMinutes: service.durationMinutes,
              category: service.category
                ? { id: service.category.id, name: service.category.name }
                : null,
            }
          : null,
        worker: worker
          ? {
              id: worker.id,
              userId: worker.user.id,
              name: worker.user.name,
              phone: worker.user.phone,
              avatarUrl: worker.user.avatarUrl,
            }
          : null,
        review: review
          ? { rating: review.rating, comment: review.comment }
          : null,
      };
    });
  }

  async findAllByClient(clientId: string) {
    const requests = await this.requestsRepository.find({
      where: { client: { id: clientId } },
      relations: ['client'],
      order: { scheduledAt: 'DESC' },
    });
    return this.enrich(requests);
  }

  async findAllByWorker(userId: string) {
    const worker = await this.workersService.findMine(userId);

    const requests = await this.requestsRepository.find({
      where: { workerId: worker.id },
      relations: ['client'],
      order: { scheduledAt: 'DESC' },
    });
    return this.enrich(requests);
  }

  async findOne(id: string): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['client'],
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found.`);
    }

    return request;
  }

  async findOneForUser(id: string, userId: string) {
    const request = await this.findOne(id);
    await this.ensureParticipant(request, userId);

    const [detail] = await this.enrich([request]);
    return detail;
  }

  async updateStatus(id: string, userId: string, dto: UpdateRequestStatusDto) {
    const request = await this.findOne(id);
    const actor = await this.ensureParticipant(request, userId);

    this.requestsRulesService.ensureCanBeUpdated(request, dto.status);
    this.requestsRulesService.ensureActorCanSetStatus(dto.status, actor);

    if (dto.status === RequestStatus.ACCEPTED) {
      // Solo se aceptan solicitudes de clientes de la misma ciudad del trabajador.
      const worker = await this.workersService.findOne(request.workerId);
      this.requestsRulesService.ensureSameCity(
        request.client.location,
        worker.user.location,
        'accept',
      );
      await this.availabilityService.ensureRequestFitsAvailability(
        request.workerId,
        request.serviceId,
        request.scheduledAt,
        request.id,
      );
    }

    request.status = dto.status;

    if (dto.status === RequestStatus.CANCELLED) {
      request.cancellationReason = dto.reason?.trim() ?? null;
      request.cancellationNote = dto.note?.trim() ?? null;
      request.cancelledBy = actor;
      request.cancelledAt = new Date();
    }

    await this.requestsRepository.save(request);
    const [detail] = await this.enrich([request]);
    return detail;
  }

  private async resolveActor(
    request: RequestEntity,
    userId: string,
  ): Promise<RequestActor | null> {
    if (request.client.id === userId) {
      return 'client';
    }

    try {
      const worker = await this.workersService.findMine(userId);

      if (worker.id === request.workerId) {
        return 'worker';
      }
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    return null;
  }

  private async ensureParticipant(
    request: RequestEntity,
    userId: string,
  ): Promise<RequestActor> {
    const actor = await this.resolveActor(request, userId);

    if (!actor) {
      throw new ForbiddenException('You do not have access to this request.');
    }

    return actor;
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

  findAllByClient(clientId: string): Promise<RequestEntity[]> {
    return this.requestsRepository.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByWorker(userId: string): Promise<RequestEntity[]> {
    const worker = await this.workersService.findMine(userId);

    return this.requestsRepository.find({
      where: { workerId: worker.id },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });
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

  async findOneForUser(id: string, userId: string): Promise<RequestEntity> {
    const request = await this.findOne(id);
    await this.ensureParticipant(request, userId);

    return request;
  }

  async updateStatus(
    id: string,
    userId: string,
    dto: UpdateRequestStatusDto,
  ): Promise<RequestEntity> {
    const request = await this.findOne(id);
    const actor = await this.ensureParticipant(request, userId);

    this.requestsRulesService.ensureCanBeUpdated(request, dto.status);
    this.requestsRulesService.ensureActorCanSetStatus(dto.status, actor);

    if (dto.status === RequestStatus.ACCEPTED) {
      await this.availabilityService.ensureRequestFitsAvailability(
        request.workerId,
        request.serviceId,
        request.scheduledAt,
        request.id,
      );
    }

    request.status = dto.status;

    return this.requestsRepository.save(request);
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
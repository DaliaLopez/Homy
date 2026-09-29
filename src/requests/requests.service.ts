import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { UserEntity } from '../users/user.entity';
import { ServiceEntity } from '../services/service.entity';
import { WorkerEntity } from '../workers/worker.entity';
import { RequestRulesService } from './request-rules/request-rules.service';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,

    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,

    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,

    private readonly requestRulesService: RequestRulesService,
  ) {}

  async create(createRequestDto: CreateRequestDto): Promise<RequestEntity> {
    this.requestRulesService.ensureCanBeCreated(
      createRequestDto.date,
      createRequestDto.time,
    );

    const user = await this.usersRepository.findOneBy({
      id: createRequestDto.userId,
    });
    if (!user) {
      throw new NotFoundException(
        `User with id ${createRequestDto.userId} was not found`,
      );
    }

    const worker = await this.workersRepository.findOneBy({
      id: createRequestDto.workerId,
    });
    if (!worker) {
      throw new NotFoundException(
        `Worker with id ${createRequestDto.workerId} was not found`,
      );
    }

    const service = await this.servicesRepository.findOneBy({
      id: createRequestDto.serviceId,
    });
    if (!service) {
      throw new NotFoundException(
        `Service with id ${createRequestDto.serviceId} was not found`,
      );
    }

    const request = this.requestsRepository.create({
      user,
      worker,
      service,
      date: createRequestDto.date,
      time: createRequestDto.time,
      address: createRequestDto.address,
      description: createRequestDto.description,
      price: service.price,
      status: 'solicitado',
    });

    return this.requestsRepository.save(request);
  }

  async findAll(): Promise<RequestEntity[]> {
    return this.requestsRepository.find({
      relations: {
        user: true,
        worker: true,
        service: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async findOne(id: number): Promise<RequestEntity> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: {
        user: true,
        worker: true,
        service: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Request with id ${id} was not found`);
    }

    return request;
  }

  async findByClient(userId: number): Promise<RequestEntity[]> {
    return this.requestsRepository.find({
      where: { user: { id: userId } },
      relations: {
        worker: true,
        service: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findRecentPendingByClient(userId: number): Promise<RequestEntity[]> {
    return this.requestsRepository.find({
      where: {
        user: { id: userId },
        status: 'solicitado',
      },
      relations: {
        worker: true,
        service: true,
      },
      order: {
        id: 'DESC',
      },
      take: 5,
    });
  }

  async update(
    id: number,
    updateRequestDto: UpdateRequestDto,
  ): Promise<RequestEntity> {
    const request = await this.findOne(id);
    this.requestsRepository.merge(request, updateRequestDto);
    return this.requestsRepository.save(request);
  }

  async cancelRequest(id: number, userId: number): Promise<RequestEntity> {
    const request = await this.findOne(id);
    this.requestRulesService.ensureCanBeCancelled(request, userId);

    request.status = 'cancelado';
    return this.requestsRepository.save(request);
  }
}
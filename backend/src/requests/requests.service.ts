import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request.dto';
import { RequestEntity } from './entities/request.entity';
import { RequestStatus } from './enums/request-status.enum';
import { RequestsRulesService } from './request-rules/request-rules.service';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class RequestsService {
    constructor(
        @InjectRepository(RequestEntity)
        private readonly requestsRepository: Repository<RequestEntity>,
        private readonly requestsRulesService: RequestsRulesService,
    ) { }

    async create(clientId: string, dto: CreateRequestDto): Promise<RequestEntity> {
        const request = this.requestsRepository.create({
            description: dto.description,
            scheduledAt: new Date(dto.scheduledAt),
            address: dto.address,
            price: dto.price,
            workerId: dto.workerId,
            serviceId: dto.serviceId,
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

    async updateStatus(id: string, dto: UpdateRequestStatusDto): Promise<RequestEntity> {
        const request = await this.findOne(id);

        this.requestsRulesService.ensureCanBeUpdated(request, dto.status);

        request.status = dto.status;
        return this.requestsRepository.save(request);
    }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, MoreThanOrEqual, Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { VerificationStatus } from '../verifications/enums/verification-status.enum';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { FindWorkersQueryDto } from './dto/find-workers-query.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerEntity } from './entities/worker.entity';
import { WorkersRulesService } from './worker-rules/workers-rules.service';

// Vista pública: nunca se expone email, teléfono ni hash del usuario (RNF04)
const PUBLIC_SELECT: FindOptionsSelect<WorkerEntity> = {
    id: true,
    description: true,
    experience: true,
    verificationStatus: true,
    averageRating: true,
    createdAt: true,
    user: { id: true, name: true, location: true },
};

@Injectable()
export class WorkersService {
    constructor(
        @InjectRepository(WorkerEntity)
        private readonly workersRepository: Repository<WorkerEntity>,
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        private readonly workersRulesService: WorkersRulesService,
    ) { }

    async create(userId: string, dto: CreateWorkerDto): Promise<WorkerEntity> {
        const existing = await this.workersRepository.findOne({ where: { user: { id: userId } } });
        this.workersRulesService.ensureProfileDoesNotExist(existing);

        const worker = this.workersRepository.create({
            description: dto.description,
            experience: dto.experience,
            user: { id: userId } as UserEntity,
        });
        const saved = await this.workersRepository.save(worker);

        // Quien crea un perfil profesional pasa a ser trabajador (un admin conserva su rol)
        await this.usersRepository.update({ id: userId, role: 'user' }, { role: 'worker' });

        return saved;
    }

    findAll(query: FindWorkersQueryDto): Promise<WorkerEntity[]> {
        return this.workersRepository.find({
            where: {
                ...(query.verificationStatus && { verificationStatus: query.verificationStatus }),
                ...(query.minRating !== undefined && { averageRating: MoreThanOrEqual(query.minRating) }),
            },
            relations: { user: true },
            select: PUBLIC_SELECT,
            order: { averageRating: 'DESC', createdAt: 'DESC' },
            take: query.limit ?? 50,
        });
    }

    async findOne(id: string): Promise<WorkerEntity> {
        const worker = await this.workersRepository.findOne({
            where: { id },
            relations: { user: true },
            select: PUBLIC_SELECT,
        });

        if (!worker) {
            throw new NotFoundException(`Worker profile with ID ${id} not found.`);
        }

        return worker;
    }

    async findMine(userId: string): Promise<WorkerEntity> {
        const worker = await this.workersRepository.findOne({
            where: { user: { id: userId } },
            relations: { user: true },
            select: PUBLIC_SELECT,
        });

        if (!worker) {
            throw new NotFoundException('You do not have a professional profile yet.');
        }

        return worker;
    }

    async updateMine(userId: string, dto: UpdateWorkerDto): Promise<WorkerEntity> {
        const worker = await this.findMine(userId);

        if (dto.description !== undefined) worker.description = dto.description;
        if (dto.experience !== undefined) worker.experience = dto.experience;

        return this.workersRepository.save(worker);
    }

    // --- Métodos para otros módulos (reviews y verifications) ---

    async setVerificationStatus(workerId: string, status: VerificationStatus): Promise<void> {
        await this.findOne(workerId);
        await this.workersRepository.update({ id: workerId }, { verificationStatus: status });
    }

    async updateAverageRating(workerId: string, average: number): Promise<void> {
        await this.workersRepository.update({ id: workerId }, { averageRating: average });
    }
}

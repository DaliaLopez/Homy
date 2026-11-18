import { sameCity } from '../common/location';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsSelect, In, MoreThanOrEqual, Repository } from 'typeorm';
import { ServiceEntity } from '../services/entities/service.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { UserEntity } from '../users/entities/user.entity';
import { VerificationStatus } from '../verifications/enums/verification-status.enum';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { FindWorkersQueryDto } from './dto/find-workers-query.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerEntity } from './entities/worker.entity';
import { WorkersRulesService } from './worker-rules/workers-rules.service';

const PUBLIC_SELECT: FindOptionsSelect<WorkerEntity> = {
  id: true,
  description: true,
  experience: true,
  verificationStatus: true,
  averageRating: true,
  approvedCategories: true,
  createdAt: true,
  user: { id: true, name: true, location: true, avatarUrl: true, phone: true },
};

export type PublicService = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: { id: string; name: string };
};

@Injectable()
export class WorkersService {
  constructor(
    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    private readonly workersRulesService: WorkersRulesService,
  ) {}

  async create(userId: string, dto: CreateWorkerDto): Promise<WorkerEntity> {
    const existing = await this.workersRepository.findOne({
      where: { user: { id: userId } },
    });
    this.workersRulesService.ensureProfileDoesNotExist(existing);

    const worker = this.workersRepository.create({
      description: dto.description,
      experience: dto.experience,
      user: { id: userId } as UserEntity,
    });
    const saved = await this.workersRepository.save(worker);

    return saved;
  }

  /**
   * Agrega a cada perfil sus servicios publicados, el precio mínimo y cuántos
   * servicios ha completado. Es lo que muestran el catálogo y el perfil público.
   */
  async enrich(workers: WorkerEntity[]) {
    if (workers.length === 0) return [];
    const ids = workers.map((worker) => worker.id);

    const services = await this.servicesRepository.find({
      where: { worker: { id: In(ids) }, isActive: true, status: 'published' },
      relations: { category: true, worker: true },
      order: { price: 'ASC' },
    });

    const completed = await this.requestsRepository
      .createQueryBuilder('request')
      .select('request.worker_id', 'workerId')
      .addSelect('COUNT(*)', 'total')
      .where('request.worker_id IN (:...ids)', { ids })
      .andWhere('request.status = :status', { status: RequestStatus.COMPLETED })
      .groupBy('request.worker_id')
      .getRawMany<{ workerId: string; total: string }>();

    return workers.map((worker) => {
      const own: PublicService[] = services
        .filter((service) => service.worker.id === worker.id)
        .map((service) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: Number(service.price),
          durationMinutes: service.durationMinutes,
          category: { id: service.category.id, name: service.category.name },
        }));

      return {
        ...worker,
        services: own,
        minPrice: own.length
          ? Math.min(...own.map((service) => service.price))
          : null,
        completedCount: Number(
          completed.find((row) => row.workerId === worker.id)?.total ?? 0,
        ),
      };
    });
  }

  async findAllPublic(query: FindWorkersQueryDto) {
    const workers = await this.findAll(query);
    // Con ?city=… solo se muestran los trabajadores de la misma ciudad del cliente.
    return this.enrich(
      query.city
        ? workers.filter((worker) => sameCity(worker.user.location, query.city))
        : workers,
    );
  }

  async findOnePublic(id: string) {
    const [worker] = await this.enrich([await this.findOne(id)]);
    return worker;
  }

  async addApprovedCategories(
    workerId: string,
    categories: { id: string; name: string }[],
  ): Promise<void> {
    const worker = await this.workersRepository.findOneByOrFail({
      id: workerId,
    });
    const current = worker.approvedCategories ?? [];
    const merged = [...current];
    for (const category of categories) {
      if (!merged.some((item) => item.id === category.id))
        merged.push(category);
    }
    await this.workersRepository.update(
      { id: workerId },
      { approvedCategories: merged },
    );
  }

  findAll(query: FindWorkersQueryDto): Promise<WorkerEntity[]> {
    return this.workersRepository.find({
      where: {
        ...(query.verificationStatus && {
          verificationStatus: query.verificationStatus,
        }),
        ...(query.minRating !== undefined && {
          averageRating: MoreThanOrEqual(query.minRating),
        }),
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
      throw new NotFoundException(
        'You do not have a professional profile yet.',
      );
    }

    return worker;
  }

  async updateMine(
    userId: string,
    dto: UpdateWorkerDto,
  ): Promise<WorkerEntity> {
    const worker = await this.findMine(userId);

    if (dto.description !== undefined) worker.description = dto.description;
    if (dto.experience !== undefined) worker.experience = dto.experience;

    return this.workersRepository.save(worker);
  }

  async setVerificationStatus(
    workerId: string,
    status: VerificationStatus,
  ): Promise<void> {
    await this.findOne(workerId);
    await this.workersRepository.update(
      { id: workerId },
      { verificationStatus: status },
    );
  }

  async updateAverageRating(workerId: string, average: number): Promise<void> {
    await this.workersRepository.update(
      { id: workerId },
      { averageRating: average },
    );
  }
}

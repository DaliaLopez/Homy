import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { WorkersService } from '../workers/workers.service';
import { FindVerificationsQueryDto } from './dto/find-verifications-query.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { VerificationEntity } from './entities/verification.entity';
import { VerificationStatus } from './enums/verification-status.enum';
import { VerificationsRulesService } from './verification-rules/verifications-rules.service';

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(VerificationEntity)
    private readonly verificationsRepository: Repository<VerificationEntity>,
    private readonly workersService: WorkersService,
    private readonly verificationsRulesService: VerificationsRulesService,
  ) {}

  // El trabajador solicita que revisen su perfil
  async request(userId: string): Promise<VerificationEntity> {
    const worker = await this.workersService.findMine(userId);

    const hasPending = await this.verificationsRepository.exists({
      where: { worker: { id: worker.id }, status: VerificationStatus.PENDING },
    });
    this.verificationsRulesService.ensureCanRequest(
      worker.verificationStatus,
      hasPending,
    );

    const verification = this.verificationsRepository.create({
      worker: { id: worker.id } as WorkerEntity,
      status: VerificationStatus.PENDING,
    });
    return this.verificationsRepository.save(verification);
  }

  async findMine(userId: string): Promise<VerificationEntity[]> {
    const worker = await this.workersService.findMine(userId);

    return this.verificationsRepository.find({
      where: { worker: { id: worker.id } },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Solo administrador (AdminGuard en el controlador) ---

  findAll(query: FindVerificationsQueryDto): Promise<VerificationEntity[]> {
    return this.verificationsRepository.find({
      where: query.status ? { status: query.status } : {},
      relations: { worker: { user: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<VerificationEntity> {
    const verification = await this.verificationsRepository.findOne({
      where: { id },
      relations: { worker: { user: true }, reviewedBy: true },
    });

    if (!verification) {
      throw new NotFoundException(`Verification with ID ${id} not found.`);
    }

    return verification;
  }

  async review(
    id: string,
    adminId: string,
    dto: ReviewVerificationDto,
  ): Promise<VerificationEntity> {
    const verification = await this.findOne(id);
    this.verificationsRulesService.ensureCanBeReviewed(verification);

    verification.status = dto.status;
    verification.reviewedBy = { id: adminId } as UserEntity;
    verification.verifiedAt =
      dto.status === VerificationStatus.VERIFIED ? new Date() : null;

    const saved = await this.verificationsRepository.save(verification);

    // El estado visible en el perfil público se mantiene sincronizado
    await this.workersService.setVerificationStatus(
      verification.worker.id,
      dto.status,
    );

    return saved;
  }
}

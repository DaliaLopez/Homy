import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { withoutData } from '../common/stored-file';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';
import { WorkerEntity } from '../workers/entities/worker.entity';
import { WorkersService } from '../workers/workers.service';
import {
  CreateVerificationDto,
  ResubmitVerificationDto,
} from './dto/create-verification.dto';
import { FindVerificationsQueryDto } from './dto/find-verifications-query.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import {
  VerificationCategory,
  VerificationDocument,
} from './entities/verification-items';
import { VerificationEntity } from './entities/verification.entity';
import { VerificationStatus } from './enums/verification-status.enum';
import { VerificationsRulesService } from './verification-rules/verifications-rules.service';

const DOCUMENT_LABELS: Record<VerificationDocument['key'], string> = {
  profile: 'Foto de perfil',
  id: 'Cédula de ciudadanía',
  selfie: 'Foto con tu cédula',
};

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(VerificationEntity)
    private readonly verificationsRepository: Repository<VerificationEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly workersService: WorkersService,
    private readonly verificationsRulesService: VerificationsRulesService,
  ) {}

  private async findOrCreateWorker(
    userId: string,
    dto: CreateVerificationDto,
  ): Promise<WorkerEntity> {
    try {
      return await this.workersService.findMine(userId);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      // El perfil profesional se crea con la primera verificación.
      await this.workersService.create(userId, {
        description:
          dto.description?.trim() ||
          'Profesional de servicios para el hogar en Homy.',
        experience: dto.experience?.trim() || 'Sin especificar',
      });
      return this.workersService.findMine(userId);
    }
  }

  private async resolveCategories(
    items: {
      categoryId: string;
      note?: string;
      files: VerificationCategory['files'];
    }[],
  ): Promise<VerificationCategory[]> {
    const ids = items.map((item) => item.categoryId);
    const categories = await this.categoriesRepository.findBy({
      id: In(ids),
      isActive: true,
    });
    return items.map((item) => {
      const category = categories.find((row) => row.id === item.categoryId);
      if (!category) {
        throw new NotFoundException(
          `Category ${item.categoryId} was not found or is inactive.`,
        );
      }
      return {
        categoryId: category.id,
        name: category.name,
        note: item.note?.trim() || null,
        files: item.files,
        status: 'pending',
        reasons: [],
        comment: null,
      };
    });
  }

  async request(
    userId: string,
    dto: CreateVerificationDto,
  ): Promise<VerificationEntity> {
    const worker = await this.findOrCreateWorker(userId, dto);

    const open = await this.verificationsRepository.find({
      where: {
        worker: { id: worker.id },
        status: In([
          VerificationStatus.PENDING,
          VerificationStatus.CHANGES_REQUESTED,
        ]),
      },
    });

    const categoryIds = dto.categories.map((item) => item.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
      throw new BadRequestException(
        'Each category can only be requested once.',
      );
    }

    this.verificationsRulesService.ensureCanRequest(
      dto.type,
      worker.verificationStatus,
      open,
      categoryIds,
      (worker.approvedCategories ?? []).map((category) => category.id),
    );

    const documents: VerificationDocument[] = [];
    if (dto.type === 'initial') {
      const keys = (dto.documents ?? []).map((doc) => doc.key);
      this.verificationsRulesService.ensureRequiredDocuments(keys);
      for (const doc of dto.documents ?? []) {
        documents.push({
          key: doc.key,
          label: DOCUMENT_LABELS[doc.key],
          file: doc.file,
          status: 'pending',
          reasons: [],
          comment: null,
        });
      }
      // La foto de perfil enviada también se usa como avatar.
      const profile = documents.find((doc) => doc.key === 'profile');
      if (profile && profile.file.type.startsWith('image/')) {
        await this.usersRepository.update(
          { id: userId },
          { avatarUrl: profile.file.dataUrl },
        );
      }
      if (dto.description || dto.experience) {
        await this.workersService.updateMine(userId, {
          ...(dto.description ? { description: dto.description } : {}),
          ...(dto.experience && dto.experience.length >= 10
            ? { experience: dto.experience }
            : {}),
        });
      }
    }

    const verification = this.verificationsRepository.create({
      worker: { id: worker.id } as WorkerEntity,
      status: VerificationStatus.PENDING,
      type: dto.type,
      documents,
      categories: await this.resolveCategories(dto.categories),
    });

    if (dto.type === 'initial') {
      await this.workersService.setVerificationStatus(
        worker.id,
        VerificationStatus.PENDING,
      );
    }

    return this.verificationsRepository.save(verification);
  }

  async resubmit(id: string, userId: string, dto: ResubmitVerificationDto) {
    const worker = await this.workersService.findMine(userId);
    const verification = await this.findOne(id);
    if (verification.worker.id !== worker.id) {
      throw new ForbiddenException(
        'This verification belongs to another worker.',
      );
    }
    this.verificationsRulesService.ensureCanResubmit(verification);

    for (const doc of dto.documents ?? []) {
      const current = verification.documents.find(
        (item) => item.key === doc.key,
      );
      if (current && current.status === 'rejected') {
        Object.assign(current, {
          file: doc.file,
          status: 'pending',
          reasons: [],
          comment: null,
        });
      }
    }
    for (const item of dto.categories ?? []) {
      const current = verification.categories.find(
        (row) => row.categoryId === item.categoryId,
      );
      if (current && current.status === 'rejected') {
        Object.assign(current, {
          files: item.files,
          note: item.note?.trim() || current.note,
          status: 'pending',
          reasons: [],
          comment: null,
        });
      }
    }

    if (
      verification.documents.some((doc) => doc.status === 'rejected') ||
      verification.categories.some((cat) => cat.status === 'rejected')
    ) {
      throw new BadRequestException(
        'Upload a new file for every item that needs corrections.',
      );
    }

    verification.status = VerificationStatus.PENDING;
    return this.verificationsRepository.save(verification);
  }

  async findMine(userId: string): Promise<VerificationEntity[]> {
    let worker: WorkerEntity;
    try {
      worker = await this.workersService.findMine(userId);
    } catch (error) {
      // Un trabajador recién registrado todavía no tiene perfil ni verificaciones.
      if (error instanceof NotFoundException) return [];
      throw error;
    }

    return this.verificationsRepository.find({
      where: { worker: { id: worker.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(query: FindVerificationsQueryDto) {
    const rows = await this.verificationsRepository.find({
      where: query.status ? { status: query.status } : {},
      relations: { worker: { user: true } },
      order: { createdAt: 'ASC' },
    });
    // En los listados no se envía el contenido de los archivos.
    return rows.map((row) => ({
      ...row,
      worker: {
        ...row.worker,
        user: { ...row.worker.user, avatarUrl: null },
      },
      documents: row.documents.map(({ file, ...doc }) => ({
        ...doc,
        file: withoutData([file])[0],
      })),
      categories: row.categories.map(({ files, ...cat }) => ({
        ...cat,
        files: withoutData(files),
      })),
    }));
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

    for (const doc of verification.documents) {
      if (doc.status !== 'pending') continue;
      const decision = dto.documents?.find((item) => item.key === doc.key);
      if (!decision) {
        throw new BadRequestException(`Missing a decision for ${doc.label}.`);
      }
      doc.status = decision.status;
      doc.reasons =
        decision.status === 'rejected' ? (decision.reasons ?? []) : [];
      doc.comment =
        decision.status === 'rejected'
          ? decision.comment?.trim() || null
          : null;
    }
    for (const cat of verification.categories) {
      if (cat.status !== 'pending') continue;
      const decision = dto.categories?.find(
        (item) => item.categoryId === cat.categoryId,
      );
      if (!decision) {
        throw new BadRequestException(`Missing a decision for ${cat.name}.`);
      }
      cat.status = decision.status;
      cat.reasons =
        decision.status === 'rejected' ? (decision.reasons ?? []) : [];
      cat.comment =
        decision.status === 'rejected'
          ? decision.comment?.trim() || null
          : null;
    }

    const docsRejected = verification.documents.some(
      (doc) => doc.status === 'rejected',
    );
    const approvedCats = verification.categories.filter(
      (cat) => cat.status === 'approved',
    );
    const catsRejected = verification.categories.some(
      (cat) => cat.status === 'rejected',
    );

    verification.reviewedBy = { id: adminId } as UserEntity;
    verification.reviewedAt = new Date();

    if (verification.type === 'initial') {
      if (docsRejected || approvedCats.length === 0) {
        verification.status = VerificationStatus.CHANGES_REQUESTED;
        await this.workersService.setVerificationStatus(
          verification.worker.id,
          VerificationStatus.CHANGES_REQUESTED,
        );
      } else {
        // Identidad aprobada y al menos una categoría: el perfil queda verificado.
        verification.status = catsRejected
          ? VerificationStatus.CHANGES_REQUESTED
          : VerificationStatus.VERIFIED;
        verification.verifiedAt = new Date();
        await this.workersService.setVerificationStatus(
          verification.worker.id,
          VerificationStatus.VERIFIED,
        );
        await this.workersService.addApprovedCategories(
          verification.worker.id,
          approvedCats.map((cat) => ({ id: cat.categoryId, name: cat.name })),
        );
      }
    } else {
      if (approvedCats.length) {
        await this.workersService.addApprovedCategories(
          verification.worker.id,
          approvedCats.map((cat) => ({ id: cat.categoryId, name: cat.name })),
        );
      }
      verification.status = catsRejected
        ? VerificationStatus.CHANGES_REQUESTED
        : VerificationStatus.VERIFIED;
      verification.verifiedAt = catsRejected ? null : new Date();
    }

    return this.verificationsRepository.save(verification);
  }
}

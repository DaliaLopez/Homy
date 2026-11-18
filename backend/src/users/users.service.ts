import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestEntity } from '../requests/entities/request.entity';
import { Repository, QueryFailedError } from 'typeorm';
import * as argon2 from 'argon2';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRulesService } from './user-rules/user-rules.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,
    private readonly rulesService: UserRulesService,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const email = dto.email.toLowerCase();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = this.usersRepository.create({
      ...dto,
      email,
      passwordHash,
    });

    try {
      const savedUser = await this.usersRepository.save(user);
      const { passwordHash: _, ...result } = savedUser;
      return result;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException('The email is already registered');
      }
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /** Perfil visto por el administrador: incluye cuántas solicitudes ha hecho como cliente. */
  async findOneForAdmin(id: string) {
    const user = await this.findOne(id);
    const requestsCount = await this.requestsRepository.count({
      where: { client: { id } },
    });
    return { ...user, requestsCount };
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const newEmail = dto.email.toLowerCase();

      const existingUser = await this.usersRepository.findOneBy({
        email: newEmail,
      });

      this.rulesService.ensureEmailIsUnique(existingUser, newEmail);

      user.email = newEmail;
    }

    if (dto.name) user.name = dto.name;
    if (dto.phone) user.phone = dto.phone;
    if (dto.location) user.location = dto.location;
    if (dto.role) user.role = dto.role;

    return this.usersRepository.save(user);
  }

  async suspend(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<UserEntity> {
    const user = await this.findOne(id);
    this.ensureNotSelfOrAdmin(user, adminId);

    user.status = 'suspended';
    user.suspensionReason = reason.trim();
    user.suspendedAt = new Date();
    return this.usersRepository.save(user);
  }

  async reactivate(id: string): Promise<UserEntity> {
    const user = await this.findOne(id);
    user.status = 'active';
    user.suspensionReason = null;
    user.suspendedAt = null;
    return this.usersRepository.save(user);
  }

  private ensureNotSelfOrAdmin(user: UserEntity, adminId: string): void {
    if (user.id === adminId) {
      throw new BadRequestException(
        'You cannot suspend or delete your own account.',
      );
    }
    if (user.role === 'admin') {
      throw new BadRequestException(
        'Administrator accounts cannot be suspended.',
      );
    }
  }

  async removeAsAdmin(id: string, adminId: string): Promise<void> {
    const user = await this.findOne(id);
    if (user.id === adminId) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    await this.usersRepository.remove(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}

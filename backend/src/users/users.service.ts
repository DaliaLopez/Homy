import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}

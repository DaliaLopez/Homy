import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { QueryFailedError, Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = this.usersRepository.create({
      name: dto.name,
      email,
      passwordHash,
      role: dto.role,
      phone: dto.phone.trim(),
      location: dto.location.trim(),
    });

    try {
      const savedUser = await this.usersRepository.save(user);
      return {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('The email is already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        suspensionReason: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await argon2.verify(user.passwordHash, dto.password);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'suspended') {
      // La cuenta se conserva, pero no puede operar mientras esté suspendida.
      throw new ForbiddenException(
        user.suspensionReason
          ? `Your account is suspended: ${user.suspensionReason}`
          : 'Your account is suspended.',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: String(user.id),
    });
    // El frontend usa el rol para enviar a cada usuario a su panel
    // (/admin, /worker o /my) sin hacer una segunda petición a /auth/me.
    return {
      access_token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.getProfile(userId);
    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.phone !== undefined) user.phone = dto.phone.trim();
    if (dto.location !== undefined) user.location = dto.location.trim();
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    return this.usersRepository.save(user);
  }
}

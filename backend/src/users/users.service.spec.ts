import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { Test } from '@nestjs/testing';
import { UserRulesService } from './user-rules/user-rules.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import * as argon2 from 'argon2';

jest.mock('argon2', () => ({
  hash: jest.fn<() => Promise<string>>().mockResolvedValue('hashed_password'),
  argon2id: 2,
}));

describe('UsersServiceTest', () => {
  let service: UsersService;

  const repositoryMock = {
    find: jest.fn<() => Promise<UserEntity[]>>(),
    findOneBy: jest.fn<(options: any) => Promise<UserEntity | null>>(),
    create: jest.fn<(user: Partial<UserEntity>) => UserEntity>(),
    save: jest.fn<(user: UserEntity) => Promise<UserEntity>>(),
    remove: jest.fn<(user: UserEntity) => Promise<UserEntity>>(),
  };

  const usersRulesServiceMock = {
    ensureEmailIsUnique: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: repositoryMock,
        },
        {
          provide: UserRulesService,
          useValue: usersRulesServiceMock,
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('returns a user when the id exists', async () => {
    const userMock = {
      id: 'uuid-1',
      name: 'Dalia',
      email: 'dalia@example.com',
      phone: '3001234567',
      location: 'Cali',
      role: 'user',
    } as UserEntity;

    repositoryMock.findOneBy.mockResolvedValue(userMock);

    const result = await service.findOne('uuid-1');

    expect(result).toEqual(userMock);
    expect(repositoryMock.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
  });

  it('throws NotFoundException when the user does not exist', async () => {
    repositoryMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOne('uuid-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a user and hashes the password', async () => {
    const dto = {
      name: 'Dalia',
      email: 'dalia@test.com',
      password: 'Password123',
      phone: '3001234567',
      location: 'Cali',
      role: 'user',
    };

    const createdUser = {
      ...dto,
      passwordHash: 'hashed_password',
    } as unknown as UserEntity;
    const savedUser = { ...createdUser, id: 'uuid-1' };

    repositoryMock.create.mockReturnValue(createdUser);
    repositoryMock.save.mockResolvedValue(savedUser);

    const result = await service.create(dto);

    expect(argon2.hash).toHaveBeenCalledWith(dto.password, {
      type: argon2.argon2id,
    });
    expect(repositoryMock.save).toHaveBeenCalledWith(createdUser);
    expect(result.id).toEqual('uuid-1');
  });

  it('throws ConflictException when email already exists', async () => {
    const dto = {
      name: 'Dalia',
      email: 'dalia@test.com',
      password: 'Password123',
      phone: '3001234567',
      location: 'Cali',
      role: 'user',
    };

    const createdUser = {
      ...dto,
      passwordHash: 'hashed_password',
    } as unknown as UserEntity;
    repositoryMock.create.mockReturnValue(createdUser);

    const error = new QueryFailedError('query', [], new Error('Driver Error'));
    (error as any).driverError = { code: '23505' };

    repositoryMock.save.mockRejectedValue(error);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});

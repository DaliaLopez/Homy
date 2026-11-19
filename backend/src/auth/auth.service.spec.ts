import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UserEntity } from '../users/entities/user.entity';

// @nestjs/jwt se publica como módulo ES y Jest no lo carga; aquí no se firman tokens.
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

// El trabajador no puede cambiar su nombre ni su foto desde "Datos de mi cuenta"
// (son los que aprobó el administrador en la verificación).
describe('AuthService.updateProfile', () => {
  let service: AuthService;

  const usersRepositoryMock = {
    findOneBy: jest.fn<(where: any) => Promise<UserEntity | null>>(),
    save: jest.fn<(user: UserEntity) => Promise<UserEntity>>(),
  };

  const worker = () =>
    ({
      id: 'u1',
      role: 'worker',
      name: 'Carlos Mendoza',
      phone: '3001112233',
      location: 'Cali, Valle del Cauca',
      avatarUrl: 'data:image/png;base64,AAA',
    }) as UserEntity;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: usersRepositoryMock,
        },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
    usersRepositoryMock.save.mockImplementation((user) =>
      Promise.resolve(user),
    );
  });

  it('rejects a worker changing their name', async () => {
    usersRepositoryMock.findOneBy.mockResolvedValue(worker());
    await expect(
      service.updateProfile('u1', { name: 'Otro Nombre' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usersRepositoryMock.save).not.toHaveBeenCalled();
  });

  it('rejects a worker changing their profile photo', async () => {
    usersRepositoryMock.findOneBy.mockResolvedValue(worker());
    await expect(
      service.updateProfile('u1', { avatarUrl: 'data:image/png;base64,BBB' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets a worker update phone and location', async () => {
    usersRepositoryMock.findOneBy.mockResolvedValue(worker());
    const result = await service.updateProfile('u1', {
      phone: '3009998877',
      location: 'Jamundí, Valle del Cauca',
    });
    expect(result).toMatchObject({
      name: 'Carlos Mendoza',
      phone: '3009998877',
      location: 'Jamundí, Valle del Cauca',
    });
  });

  it('still lets clients change their name and photo', async () => {
    usersRepositoryMock.findOneBy.mockResolvedValue({
      ...worker(),
      role: 'user',
    });
    const result = await service.updateProfile('u1', {
      name: 'Laura Gómez',
      avatarUrl: 'data:image/png;base64,CCC',
    });
    expect(result).toMatchObject({
      name: 'Laura Gómez',
      avatarUrl: 'data:image/png;base64,CCC',
    });
  });
});

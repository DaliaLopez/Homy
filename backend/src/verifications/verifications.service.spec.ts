import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationsService } from './verifications.service';
import { VerificationEntity } from './entities/verification.entity';
import { VerificationStatus } from './enums/verification-status.enum';
import { VerificationsRulesService } from './verification-rules/verifications-rules.service';
import { WorkersService } from '../workers/workers.service';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserEntity } from '../users/entities/user.entity';

const file = {
  name: 'a.jpg',
  type: 'image/jpeg',
  size: 10,
  dataUrl: 'data:image/jpeg;base64,AA',
};

describe('VerificationsServiceTest', () => {
  let service: VerificationsService;

  const repositoryMock = {
    find: jest.fn<(options: unknown) => Promise<VerificationEntity[]>>(),
    findOne:
      jest.fn<(options: unknown) => Promise<VerificationEntity | null>>(),
    create: jest.fn((value: unknown) => value as VerificationEntity),
    save: jest.fn((value: VerificationEntity) => Promise.resolve(value)),
  };
  const categoriesMock = {
    findBy: jest.fn(() =>
      Promise.resolve([{ id: 'c1', name: 'Plomería', isActive: true }]),
    ),
  };
  const usersMock = {
    update: jest.fn((criteria: unknown, changes: unknown) =>
      Promise.resolve(void [criteria, changes]),
    ),
  };
  const workersServiceMock = {
    findMine: jest.fn<(userId: string) => Promise<unknown>>(),
    create: jest.fn<(userId: string, dto: unknown) => Promise<void>>(),
    updateMine: jest.fn<(userId: string, dto: unknown) => Promise<void>>(),
    setVerificationStatus:
      jest.fn<
        (workerId: string, status: VerificationStatus) => Promise<void>
      >(),
    addApprovedCategories:
      jest.fn<(workerId: string, categories: unknown[]) => Promise<void>>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VerificationsService,
        VerificationsRulesService,
        {
          provide: getRepositoryToken(VerificationEntity),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(CategoryEntity),
          useValue: categoriesMock,
        },
        { provide: getRepositoryToken(UserEntity), useValue: usersMock },
        { provide: WorkersService, useValue: workersServiceMock },
      ],
    }).compile();
    service = moduleRef.get(VerificationsService);
  });

  it('creates the initial verification with its documents and categories', async () => {
    workersServiceMock.findMine.mockResolvedValue({
      id: 'w1',
      verificationStatus: VerificationStatus.PENDING,
      approvedCategories: [],
    });
    repositoryMock.find.mockResolvedValue([]);

    const result = await service.request('u1', {
      type: 'initial',
      documents: [
        { key: 'profile', file },
        { key: 'id', file },
        { key: 'selfie', file },
      ],
      categories: [{ categoryId: 'c1', note: 'Curso SENA', files: [file] }],
    });

    expect(result.documents).toHaveLength(3);
    expect(result.categories[0]).toMatchObject({
      name: 'Plomería',
      status: 'pending',
    });
    // La foto enviada no se vuelve avatar hasta que el admin apruebe los documentos.
    expect(usersMock.update).not.toHaveBeenCalled();
  });

  it('returns an empty history when the worker has no profile yet', async () => {
    workersServiceMock.findMine.mockRejectedValue(new NotFoundException());
    await expect(service.findMine('u1')).resolves.toEqual([]);
  });

  it('approves the profile and its categories when every item is approved', async () => {
    repositoryMock.findOne.mockResolvedValue({
      id: 'v1',
      type: 'initial',
      status: VerificationStatus.PENDING,
      worker: { id: 'w1' },
      documents: [
        {
          key: 'id',
          label: 'Cédula',
          status: 'pending',
          reasons: [],
          comment: null,
          file,
        },
      ],
      categories: [
        {
          categoryId: 'c1',
          name: 'Plomería',
          status: 'pending',
          reasons: [],
          comment: null,
          files: [file],
          note: null,
        },
      ],
    } as unknown as VerificationEntity);

    const result = await service.review('v1', 'admin', {
      documents: [{ key: 'id', status: 'approved' }],
      categories: [{ categoryId: 'c1', status: 'approved' }],
    });

    expect(result.status).toBe(VerificationStatus.VERIFIED);
    expect(workersServiceMock.setVerificationStatus).toHaveBeenCalledWith(
      'w1',
      VerificationStatus.VERIFIED,
    );
    expect(workersServiceMock.addApprovedCategories).toHaveBeenCalledWith(
      'w1',
      [{ id: 'c1', name: 'Plomería' }],
    );
  });

  it('asks for corrections when a document is rejected', async () => {
    repositoryMock.findOne.mockResolvedValue({
      id: 'v1',
      type: 'initial',
      status: VerificationStatus.PENDING,
      worker: { id: 'w1' },
      documents: [
        {
          key: 'id',
          label: 'Cédula',
          status: 'pending',
          reasons: [],
          comment: null,
          file,
        },
      ],
      categories: [
        {
          categoryId: 'c1',
          name: 'Plomería',
          status: 'pending',
          reasons: [],
          comment: null,
          files: [file],
          note: null,
        },
      ],
    } as unknown as VerificationEntity);

    const result = await service.review('v1', 'admin', {
      documents: [
        {
          key: 'id',
          status: 'rejected',
          reasons: ['Ilegible o borroso'],
          comment: 'Sube otra foto',
        },
      ],
      categories: [{ categoryId: 'c1', status: 'approved' }],
    });

    expect(result.status).toBe(VerificationStatus.CHANGES_REQUESTED);
    expect(result.documents[0]).toMatchObject({
      status: 'rejected',
      reasons: ['Ilegible o borroso'],
    });
    expect(workersServiceMock.addApprovedCategories).not.toHaveBeenCalled();
  });

  // La foto de perfil pasa a ser el avatar solo cuando el admin aprueba todos los documentos.
  const withProfilePhoto = () =>
    ({
      id: 'v1',
      type: 'initial',
      status: VerificationStatus.PENDING,
      worker: { id: 'w1', user: { id: 'u1' } },
      documents: ['profile', 'id', 'selfie'].map((key) => ({
        key,
        label: key,
        status: 'pending',
        reasons: [],
        comment: null,
        file,
      })),
      categories: [
        {
          categoryId: 'c1',
          name: 'Plomería',
          status: 'pending',
          reasons: [],
          comment: null,
          files: [file],
          note: null,
        },
      ],
    }) as unknown as VerificationEntity;

  it('uses the profile photo as avatar once every document is approved', async () => {
    repositoryMock.findOne.mockResolvedValue(withProfilePhoto());
    await service.review('v1', 'admin', {
      documents: (['profile', 'id', 'selfie'] as const).map((key) => ({
        key,
        status: 'approved' as const,
      })),
      categories: [{ categoryId: 'c1', status: 'approved' }],
    });
    expect(usersMock.update).toHaveBeenCalledWith(
      { id: 'u1' },
      { avatarUrl: file.dataUrl },
    );
  });

  it('keeps the initials when a document is not approved yet', async () => {
    repositoryMock.findOne.mockResolvedValue(withProfilePhoto());
    await service.review('v1', 'admin', {
      documents: [
        { key: 'profile', status: 'approved' },
        { key: 'id', status: 'rejected', reasons: ['Ilegible o borroso'] },
        { key: 'selfie', status: 'approved' },
      ],
      categories: [{ categoryId: 'c1', status: 'approved' }],
    });
    expect(usersMock.update).not.toHaveBeenCalled();
  });
});

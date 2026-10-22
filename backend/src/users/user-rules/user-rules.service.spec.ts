import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRulesService } from './user-rules.service';
import { UserEntity } from '../entities/user.entity';
import { describe, it } from 'node:test';
import { expect } from '@jest/globals';

describe('UserRulesService', () => {
    const service = new UserRulesService();

    it('allows registration when email is available', () => {
        expect(() =>
            service.ensureEmailIsAvailable('test@correo.com', null),
        ).not.toThrow();
    });

    it('rejects registration when email already exists', () => {
        const existingUser = { id: 1, email: 'test@correo.com' } as UserEntity;

        expect(() =>
            service.ensureEmailIsAvailable('test@correo.com', existingUser),
        ).toThrow(ConflictException);
    });

    it('validates correct phone numbers', () => {
        expect(() => service.ensureValidPhoneFormat('3001234567')).not.toThrow();
    });

    it('rejects invalid phone formats', () => {
        expect(() => service.ensureValidPhoneFormat('123')).toThrow(
            BadRequestException,
        );
    });
});
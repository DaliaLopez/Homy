import { ConflictException } from '@nestjs/common';
import { UserRulesService } from './user-rules.service';
import { UserEntity } from '../entities/user.entity';
import { beforeEach, describe, it, expect } from '@jest/globals';

describe('UserRulesService', () => {
    let service: UserRulesService;

    beforeEach(() => {
        service = new UserRulesService();
    });

    it('it should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('ensureEmailIsUnique', () => {
        it('it should not throw an error when existingUser is null', () => {
            expect(() => service.ensureEmailIsUnique(null, 'new@email.com')).not.toThrow();
        });

        it('should throw ConflictException if existingUser has data', () => {
            const mockUser = { id: 'uuid-1', email: 'used@email.com' } as UserEntity;

            expect(() => service.ensureEmailIsUnique(mockUser, 'usado@email.com'))
                .toThrow(ConflictException);
        });
    });
});
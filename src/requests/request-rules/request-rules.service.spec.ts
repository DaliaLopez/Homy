import { BadRequestException, ConflictException } from '@nestjs/common';
import { RequestRulesService } from './request-rules.service';
import { RequestEntity } from '../entities/request.entity';
import { UserEntity } from '../../users/user.entity';
import { describe, it } from 'node:test';
import { expect } from '@jest/globals';

describe('RequestRulesService', () => {
    const service = new RequestRulesService();

    it('allows cancellation when user is the owner and request status is "solicitado"', () => {
        const user = { id: 1 } as UserEntity;
        const request = {
            user,
            status: 'solicitado',
        } as RequestEntity;

        expect(() => service.ensureCanBeCancelled(request, 1)).not.toThrow();
    });

    it('rejects cancellation when user is not the owner', () => {
        const user = { id: 1 } as UserEntity;
        const request = {
            user,
            status: 'solicitado',
        } as RequestEntity;

        expect(() => service.ensureCanBeCancelled(request, 2)).toThrow(
            BadRequestException,
        );
    });

    it('rejects cancellation when request is already completed', () => {
        const user = { id: 1 } as UserEntity;
        const request = {
            user,
            status: 'completado',
        } as RequestEntity;

        expect(() => service.ensureCanBeCancelled(request, 1)).toThrow(
            ConflictException,
        );
    });
});
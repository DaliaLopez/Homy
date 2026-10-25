import { ConflictException, Injectable } from '@nestjs/common';
import { WorkerEntity } from '../entities/worker.entity';

@Injectable()
export class WorkersRulesService {
    ensureProfileDoesNotExist(existing: WorkerEntity | null): void {
        if (existing) {
            throw new ConflictException('The user already has a professional profile.');
        }
    }
}

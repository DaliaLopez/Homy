import { ConflictException, Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserRulesService {
  ensureEmailIsUnique(existingUser: UserEntity | null, newEmail: string): void {
    if (existingUser) {
      throw new ConflictException(
        `The email ${newEmail} is already registered`,
      );
    }
  }
}

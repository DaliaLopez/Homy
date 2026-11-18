import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type AppRole = 'user' | 'worker' | 'admin';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a uno o varios roles. Se usa junto con JwtAuthGuard. */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AppRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role;

    if (role && (roles as string[]).includes(role)) {
      return true;
    }

    throw new ForbiddenException(
      'Your role is not allowed to perform this action.',
    );
  }
}

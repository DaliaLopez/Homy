import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { ServiceEntity } from '../entities/service.entity';
import { RequestStatus } from '../../requests/enums/request-status.enum';

@Injectable()
export class ServicesRulesService {
  // Verifica que el servicio pertenezca al trabajador.
  ensureCanBeModified(service: ServiceEntity, workerId: string): void {
    if (service.worker.id !== workerId) {
      throw new ForbiddenException(
        'A worker can only modify their own services',
      );
    }
  }

  // Impide modificar un servicio que tenga solicitudes activas.
  ensureHasNoActiveRequests(statuses: RequestStatus[]): void {
    const activeStatuses = [
      RequestStatus.REQUESTED,
      RequestStatus.ACCEPTED,
      RequestStatus.IN_PROGRESS,
    ];

    for (const status of statuses) {
      if (activeStatuses.includes(status)) {
        throw new ConflictException(
          'A service cannot be modified or deleted while it has active requests',
        );
      }
    }
  }
}

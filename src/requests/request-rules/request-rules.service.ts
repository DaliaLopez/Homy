import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { RequestEntity } from '../entities/request.entity';

@Injectable()
export class RequestRulesService {
  ensureCanBeCancelled(request: RequestEntity, userId: number): void {
    if (request.user.id !== userId) {
      throw new BadRequestException(
        'No tienes permiso para cancelar esta solicitud',
      );
    }

    if (request.status === 'completado') {
      throw new ConflictException(
        'No se puede cancelar una solicitud que ya ha sido completada',
      );
    }

    if (request.status === 'cancelado') {
      throw new ConflictException(
        'La solicitud ya se encuentra cancelada',
      );
    }
  }

  ensureCanBeCreated(dateStr: string, timeStr: string): void {
    const bookingDate = new Date(`\({dateStr}T\){timeStr}:00`);
    const now = new Date();

    if (bookingDate < now) {
      throw new BadRequestException(
        'La fecha y hora programadas deben ser futuras',
      );
    }
  }
}
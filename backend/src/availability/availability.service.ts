import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

/** La duración de un servicio se agenda en horas enteras (60 min => 1 h, 90 min => 2 h). */
export function blockHours(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / 60));
}
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

import { WorkerEntity } from '../workers/entities/worker.entity';
import { RequestEntity } from '../requests/entities/request.entity';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { ServiceEntity } from '../services/entities/service.entity';

import { AvailabilityEntity } from './entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailabilityRulesService } from './availability-rules/availability-rules.service';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(AvailabilityEntity)
    private readonly availabilityRepository: Repository<AvailabilityEntity>,

    @InjectRepository(WorkerEntity)
    private readonly workersRepository: Repository<WorkerEntity>,

    @InjectRepository(RequestEntity)
    private readonly requestsRepository: Repository<RequestEntity>,

    @InjectRepository(ServiceEntity)
    private readonly servicesRepository: Repository<ServiceEntity>,

    private readonly availabilityRulesService: AvailabilityRulesService,
  ) {}

  private async findWorkerByUserId(userId: string): Promise<WorkerEntity> {
    const worker = await this.workersRepository.findOne({
      where: {
        user: { id: userId },
      },
    });

    if (!worker) {
      throw new NotFoundException(
        'You do not have a professional profile yet.',
      );
    }

    return worker;
  }

  private async findMine(
    id: string,
    workerId: string,
  ): Promise<AvailabilityEntity> {
    const availability = await this.availabilityRepository.findOne({
      where: {
        id,
        worker: { id: workerId },
      },
      relations: {
        worker: true,
      },
    });

    if (!availability) {
      throw new NotFoundException(
        'Availability not found in your professional profile.',
      );
    }

    return availability;
  }

  private timeToSeconds(time: string): number {
    const [hours, minutes, seconds = '0'] = time.split(':');

    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }

  private getDayName(date: Date): string {
    const daysOfWeek: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };

    return daysOfWeek[date.getDay()];
  }

  private isSameCalendarDay(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  private async getRequestInterval(
    request: RequestEntity,
  ): Promise<{ start: number; end: number; date: Date }> {
    const service = await this.servicesRepository.findOne({
      where: { id: request.serviceId },
    });

    if (!service) {
      throw new ConflictException(
        `The service associated with request ${request.id} was not found.`,
      );
    }

    if (
      !Number.isInteger(service.durationMinutes) ||
      service.durationMinutes <= 0
    ) {
      throw new ConflictException(
        `The service associated with request ${request.id} has an invalid duration.`,
      );
    }

    const date = new Date(request.scheduledAt);

    const start =
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

    const end = start + blockHours(service.durationMinutes) * 3600;

    return { start, end, date };
  }

  private async hasRequestsInAvailability(
    availability: AvailabilityEntity,
    workerId: string,
  ): Promise<boolean> {
    const requests = await this.requestsRepository.find({
      where: {
        workerId,
        scheduledAt: MoreThanOrEqual(new Date()),
        status: In([
          RequestStatus.REQUESTED,
          RequestStatus.ACCEPTED,
          RequestStatus.IN_PROGRESS,
        ]),
      },
    });

    const availabilityStart = this.timeToSeconds(availability.startTime);
    const availabilityEnd = this.timeToSeconds(availability.endTime);

    for (const request of requests) {
      const interval = await this.getRequestInterval(request);

      if (this.getDayName(interval.date) !== availability.day) {
        continue;
      }

      const overlaps =
        interval.start < availabilityEnd && interval.end > availabilityStart;

      if (overlaps) {
        return true;
      }
    }

    return false;
  }

  private async ensureAvailabilityCanChange(
    availability: AvailabilityEntity,
    workerId: string,
  ): Promise<void> {
    const hasRequests = await this.hasRequestsInAvailability(
      availability,
      workerId,
    );

    this.availabilityRulesService.ensureHasNoRequests(hasRequests);
  }

  async findAll(userId: string): Promise<AvailabilityEntity[]> {
    const worker = await this.findWorkerByUserId(userId);

    return this.availabilityRepository.find({
      where: {
        worker: { id: worker.id },
      },
      order: {
        day: 'ASC',
        startTime: 'ASC',
      },
    });
  }

  async findOne(userId: string, id: string): Promise<AvailabilityEntity> {
    const worker = await this.findWorkerByUserId(userId);

    return this.findMine(id, worker.id);
  }

  async findByWorker(workerId: string): Promise<AvailabilityEntity[]> {
    return this.availabilityRepository.find({
      where: { worker: { id: workerId } },
      order: { day: 'ASC', startTime: 'ASC' },
    });
  }

  async create(
    userId: string,
    dto: CreateAvailabilityDto,
  ): Promise<AvailabilityEntity> {
    const worker = await this.findWorkerByUserId(userId);

    this.availabilityRulesService.ensureValidTimeRange(
      dto.startTime,
      dto.endTime,
    );

    const existingAvailabilities = await this.availabilityRepository.find({
      where: {
        worker: { id: worker.id },
        day: dto.day,
      },
    });

    this.availabilityRulesService.ensureNoOverlap(
      dto.startTime,
      dto.endTime,
      existingAvailabilities,
    );

    const availability = this.availabilityRepository.create({
      day: dto.day,
      startTime: dto.startTime,
      endTime: dto.endTime,
      worker,
    });

    return this.availabilityRepository.save(availability);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAvailabilityDto,
  ): Promise<AvailabilityEntity> {
    const worker = await this.findWorkerByUserId(userId);
    const availability = await this.findMine(id, worker.id);

    await this.ensureAvailabilityCanChange(availability, worker.id);

    const day = dto.day ?? availability.day;
    const startTime = dto.startTime ?? availability.startTime;
    const endTime = dto.endTime ?? availability.endTime;

    this.availabilityRulesService.ensureValidTimeRange(startTime, endTime);

    const existingAvailabilities = await this.availabilityRepository.find({
      where: {
        worker: { id: worker.id },
        day,
      },
    });

    this.availabilityRulesService.ensureNoOverlap(
      startTime,
      endTime,
      existingAvailabilities,
      id,
    );

    availability.day = day;
    availability.startTime = startTime;
    availability.endTime = endTime;

    return this.availabilityRepository.save(availability);
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    const worker = await this.findWorkerByUserId(userId);
    const availability = await this.findMine(id, worker.id);

    await this.ensureAvailabilityCanChange(availability, worker.id);

    await this.availabilityRepository.remove(availability);

    return {
      message: 'Availability deleted successfully.',
    };
  }

  async ensureRequestFitsAvailability(
    workerId: string,
    serviceId: string,
    scheduledAt: Date,
    requestId: string,
  ): Promise<void> {
    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: { worker: true },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with id ${serviceId} was not found.`,
      );
    }

    if (service.worker.id !== workerId) {
      throw new ConflictException(
        'The selected service does not belong to the requested worker.',
      );
    }

    if (
      !Number.isInteger(service.durationMinutes) ||
      service.durationMinutes <= 0
    ) {
      throw new ConflictException('The service has an invalid duration.');
    }

    const startDate = new Date(scheduledAt);

    if (Number.isNaN(startDate.getTime())) {
      throw new ConflictException('The scheduled date is invalid.');
    }

    const requestStart =
      startDate.getHours() * 3600 +
      startDate.getMinutes() * 60 +
      startDate.getSeconds();

    if (startDate.getMinutes() !== 0 || startDate.getSeconds() !== 0) {
      throw new BadRequestException(
        'Services start on the hour (for example 08:00).',
      );
    }

    const requestEnd =
      requestStart + blockHours(service.durationMinutes) * 3600;

    const dayName = this.getDayName(startDate);

    const allAvailabilities = await this.availabilityRepository.find({
      where: {
        worker: { id: workerId },
      },
    });

    const matchingAvailabilities = allAvailabilities.filter(
      (availability) => availability.day === dayName,
    );

    const fitsAvailability = matchingAvailabilities.some((availability) => {
      const availabilityStart = this.timeToSeconds(availability.startTime);
      const availabilityEnd = this.timeToSeconds(availability.endTime);

      return requestStart >= availabilityStart && requestEnd <= availabilityEnd;
    });

    if (!fitsAvailability) {
      throw new ConflictException(
        'The request does not fit within the worker availability.',
      );
    }

    const activeRequests = await this.requestsRepository.find({
      where: {
        workerId,
        status: In([
          RequestStatus.REQUESTED,
          RequestStatus.ACCEPTED,
          RequestStatus.IN_PROGRESS,
        ]),
      },
    });

    for (const otherRequest of activeRequests) {
      if (otherRequest.id === requestId) {
        continue;
      }

      const otherInterval = await this.getRequestInterval(otherRequest);

      if (!this.isSameCalendarDay(startDate, otherInterval.date)) {
        continue;
      }

      const overlaps =
        requestStart < otherInterval.end && requestEnd > otherInterval.start;

      if (overlaps) {
        throw new ConflictException(
          'The worker already has another active request at that time.',
        );
      }
    }
  }

  /**
   * Horas de inicio libres de un trabajador en una fecha para un servicio.
   * Una hora sirve si todo el bloque (duración redondeada a horas) cabe en una
   * franja de disponibilidad y no se cruza con otra solicitud activa.
   * Ej.: servicio de 2 h agendado a las 08:00 => 08:00–10:00 queda ocupado.
   */
  async getFreeSlots(workerId: string, date: string, serviceId: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must use the YYYY-MM-DD format.');
    }

    const service = await this.servicesRepository.findOne({
      where: { id: serviceId },
      relations: { worker: true },
    });
    if (!service || service.worker.id !== workerId) {
      throw new NotFoundException(
        'The service does not belong to this worker.',
      );
    }

    const hours = blockHours(service.durationMinutes);
    const [year, month, day] = date.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    const dayName = this.getDayName(target);

    const availabilities = (await this.findByWorker(workerId)).filter(
      (availability) => availability.day === dayName,
    );

    const requests = await this.requestsRepository.find({
      where: {
        workerId,
        status: In([
          RequestStatus.REQUESTED,
          RequestStatus.ACCEPTED,
          RequestStatus.IN_PROGRESS,
        ]),
      },
    });

    const busy: { start: number; end: number }[] = [];
    for (const request of requests) {
      const interval = await this.getRequestInterval(request);
      if (this.isSameCalendarDay(interval.date, target)) {
        busy.push({ start: interval.start, end: interval.end });
      }
    }

    const now = new Date();
    const slots: string[] = [];
    // Horas en las que el servicio cabría completo, pero que ya tienen otra solicitud encima.
    const taken: string[] = [];
    for (const availability of availabilities) {
      const from = Math.ceil(this.timeToSeconds(availability.startTime) / 3600);
      const to = Math.floor(this.timeToSeconds(availability.endTime) / 3600);
      // Bloques seguidos del largo del servicio (8–10, 10–12, 12–14…): cada uno empieza
      // donde termina el anterior y solo cuenta si el servicio alcanza a terminar dentro de la franja.
      for (let hour = from; hour + hours <= to; hour += hours) {
        const start = hour * 3600;
        const end = start + hours * 3600;
        const slotDate = new Date(year, month - 1, day, hour);
        if (slotDate.getTime() <= now.getTime()) continue;
        const overlaps = busy.some(
          (item) => start < item.end && end > item.start,
        );
        (overlaps ? taken : slots).push(`${String(hour).padStart(2, '0')}:00`);
      }
    }
    const free = [...new Set(slots)].sort();

    return {
      date,
      durationHours: hours,
      slots: free,
      taken: [...new Set(taken)].filter((hour) => !free.includes(hour)).sort(),
      busy: busy.map((item) => ({
        from: `${String(Math.floor(item.start / 3600)).padStart(2, '0')}:00`,
        to: `${String(Math.ceil(item.end / 3600)).padStart(2, '0')}:00`,
      })),
    };
  }
}

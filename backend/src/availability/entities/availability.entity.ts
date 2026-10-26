/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { WorkerEntity } from '../../workers/entities/worker.entity';

@Entity('availability')
export class AvailabilityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => WorkerEntity, (worker) => worker.availability, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'worker_id' })
  worker!: WorkerEntity;

  @Column({ type: 'varchar', length: 20 })
  day!: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { RequestStatus } from '../enums/request-status.enum';

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.REQUESTED,
  })
  status!: RequestStatus;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'client_id' })
  client!: UserEntity;

  @Column({ type: 'uuid', name: 'worker_id' })
  workerId!: string;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId!: string;

  @Column({
    name: 'cancellation_reason',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  cancellationReason!: string | null;

  @Column({ name: 'cancellation_note', type: 'text', nullable: true })
  cancellationNote!: string | null;

  /** client | worker */
  @Column({ name: 'cancelled_by', type: 'varchar', length: 10, nullable: true })
  cancelledBy!: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

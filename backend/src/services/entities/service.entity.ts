import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CategoryEntity } from '../../categories/entities/category.entity';
import { WorkerEntity } from '../../workers/entities/worker.entity';

export type ServiceStatus =
  'in_review' | 'published' | 'changes_requested' | 'rejected';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /**
   * in_review | published | changes_requested | rejected.
   * Los servicios existentes antes de la revisión quedan publicados.
   */
  @Column({ type: 'varchar', length: 30, default: 'published' })
  status!: ServiceStatus;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt!: Date | null;

  @ManyToOne(() => CategoryEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category!: CategoryEntity;

  @ManyToOne(() => WorkerEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'worker_id' })
  worker!: WorkerEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

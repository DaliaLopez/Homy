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

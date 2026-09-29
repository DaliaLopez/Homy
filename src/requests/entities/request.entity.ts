import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { ServiceEntity } from '../services/service.entity';
import { WorkerEntity } from '../workers/worker.entity';

@Entity('requests')
export class RequestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserEntity, (user) => user.requests)
  user!: UserEntity;

  @ManyToOne(() => WorkerEntity, (worker) => worker.requests)
  worker!: WorkerEntity;

  @ManyToOne(() => ServiceEntity, (service) => service.requests)
  service!: ServiceEntity;

  @Column({ type: 'varchar', length: 10 })
  date!: string;

  @Column({ type: 'varchar', length: 5 })
  time!: string;

  @Column({ length: 255 })
  address!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ default: 'solicitado', length: 20 })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
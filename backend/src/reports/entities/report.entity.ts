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
import { ReportStatus } from '../enums/report-status.enum';

@Entity('reports')
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  reason!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status!: ReportStatus;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reporter_id' })
  reporter!: UserEntity;

  @Column({ type: 'uuid', name: 'reported_user_id' })
  reportedUserId!: string;

  @Column({ type: 'uuid', name: 'request_id' })
  requestId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

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
import type { StoredFile } from '../../common/stored-file';

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

  @ManyToOne(() => UserEntity, (user) => user.reportsReceived)
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser!: UserEntity;

  @Column({ type: 'uuid', name: 'reported_user_id' })
  reportedUserId!: string;

  @Column({ type: 'uuid', name: 'request_id' })
  requestId!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  evidence!: StoredFile[];

  /** Versión de la persona reportada. */
  @Column({ type: 'text', nullable: true })
  response!: string | null;

  @Column({ name: 'response_evidence', type: 'jsonb', default: () => "'[]'" })
  responseEvidence!: StoredFile[];

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt!: Date | null;

  /** Qué se hizo o por qué se descartó (chips del modal del admin). */
  @Column({ name: 'resolution_actions', type: 'text', nullable: true })
  resolutionActions!: string | null;

  /** Nota del administrador para las dos partes. */
  @Column({ type: 'text', nullable: true })
  resolution!: string | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

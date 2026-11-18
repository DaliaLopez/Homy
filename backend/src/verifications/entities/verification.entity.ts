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
import { WorkerEntity } from '../../workers/entities/worker.entity';
import { VerificationStatus } from '../enums/verification-status.enum';
import type {
  VerificationCategory,
  VerificationDocument,
} from './verification-items';

@Entity('verifications')
export class VerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => WorkerEntity, (worker) => worker.verifications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'worker_id' })
  worker!: WorkerEntity;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status!: VerificationStatus;

  /** initial: primera verificación. category: un trabajador verificado suma un oficio. */
  @Column({ type: 'varchar', length: 20, default: 'initial' })
  type!: 'initial' | 'category';

  @Column({ type: 'jsonb', default: () => "'[]'" })
  documents!: VerificationDocument[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  categories!: VerificationCategory[];

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @ManyToOne(() => UserEntity, (user) => user.verificationsReviewed, {
    nullable: true,
  })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt!: Date;
}

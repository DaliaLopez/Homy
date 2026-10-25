import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkerEntity } from '../../workers/entities/worker.entity';
import { VerificationStatus } from '../enums/verification-status.enum';

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

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt!: Date | null;

  // Administrador que revisó la solicitud (UserEntity.verificationsReviewed)
  @ManyToOne(() => UserEntity, (user) => user.verificationsReviewed, {
    nullable: true,
  })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy!: UserEntity | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

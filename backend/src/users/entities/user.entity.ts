import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkerEntity } from '../../workers/entities/worker.entity';
import { RequestEntity } from '../../requests/entities/request.entity';
import { ReviewEntity } from '../../reviews/entities/review.entity';
import { ReportEntity } from '../../reports/entities/report.entity';
import { VerificationEntity } from '../../verifications/entities/verification.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role!: string;

  /** active | suspended. Una cuenta suspendida no puede iniciar sesión. */
  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason!: string | null;

  @Column({ name: 'suspended_at', type: 'timestamp', nullable: true })
  suspendedAt!: Date | null;

  /** Foto de perfil comprimida (data URL). */
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  @OneToMany(() => WorkerEntity, (worker) => worker.user)
  workers!: WorkerEntity[];

  @OneToMany(() => RequestEntity, (request) => request.client)
  requests!: RequestEntity[];

  @OneToMany(() => ReviewEntity, (review) => review.user)
  reviews!: ReviewEntity[];

  @OneToMany(() => ReportEntity, (report) => report.reporter)
  reportsMade!: ReportEntity[];

  @OneToMany(() => ReportEntity, (report) => report.reportedUser)
  reportsReceived!: ReportEntity[];

  @OneToMany(
    () => VerificationEntity,
    (verification) => verification.reviewedBy,
  )
  verificationsReviewed!: VerificationEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

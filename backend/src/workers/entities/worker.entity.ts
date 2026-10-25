import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { ReviewEntity } from '../../reviews/entities/review.entity';
import { VerificationEntity } from '../../verifications/entities/verification.entity';
import { VerificationStatus } from '../../verifications/enums/verification-status.enum';

@Entity('worker_profiles')
@Unique(['user']) // un usuario solo puede tener un perfil profesional
export class WorkerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // UserEntity.workers es @OneToMany(worker.user), por eso aquí es ManyToOne
  @ManyToOne(() => UserEntity, (user) => user.workers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  experience!: string;

  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verificationStatus!: VerificationStatus;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: {
      to: (value?: number) => value,
      from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
    },
  })
  averageRating!: number;

  @OneToMany(() => ReviewEntity, (review) => review.worker)
  reviews!: ReviewEntity[];

  @OneToMany(() => VerificationEntity, (verification) => verification.worker)
  verifications!: VerificationEntity[];

  // TODO (cuando exista la entidad de Alejandra): @OneToMany(() => ServiceEntity, (s) => s.worker) services
  // TODO (cuando exista la entidad de Alejandra): @OneToMany(() => AvailabilityEntity, (a) => a.worker) availability

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

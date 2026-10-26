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
import { AvailabilityEntity } from '../../availability/entities/availability.entity';
import { ServiceEntity } from '../../services/entities/service.entity';

@Entity('worker_profiles')
@Unique(['user'])
export class WorkerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @OneToMany(() => ServiceEntity, (service) => service.worker)
  services!: ServiceEntity[];

  @OneToMany(() => AvailabilityEntity, (availability) => availability.worker)
  availability!: AvailabilityEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

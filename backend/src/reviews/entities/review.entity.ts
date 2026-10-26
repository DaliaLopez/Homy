import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkerEntity } from '../../workers/entities/worker.entity';
import { RequestEntity } from '../../requests/entities/request.entity';

@Entity('reviews')
export class ReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => UserEntity, (user) => user.reviews, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => WorkerEntity, (worker) => worker.reviews, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'worker_id' })
  worker!: WorkerEntity;

  @OneToOne(() => RequestEntity, { nullable: false })
  @JoinColumn({ name: 'request_id' })
  request!: RequestEntity;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

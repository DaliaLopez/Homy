import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('services')
export class ServiceEntity {
  @PrimaryColumn()
  id!: number;

  @Column({ length: 500 })
  name!: string;

  @Column({ type: 'text', length: 800 })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

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

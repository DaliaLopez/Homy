import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequestEntity } from '../../requests/entities/request.entity';
import type { UserRole } from '../user.interface';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ length: 150 })
  location!: string;

  @Column({ default: 'client', length: 20 })
  role!: UserRole;

  @OneToMany(() => RequestEntity, (request) => request.user)
  requests!: RequestEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

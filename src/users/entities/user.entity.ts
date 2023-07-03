import { UserStatus } from '../../constants/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Department } from '../../departments/entities/department.entity';
import { ImportRequest } from '../../import_requests/entities/import_request.entity';
import { BorrowRequest } from '../../borrow_requests/entities/borrow_request.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ name: 'photo_url' })
  photoURL: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Role, (role) => role.users, {
    cascade: ['insert', 'update'],
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => ImportRequest, (importRequest) => importRequest.createdBy)
  importRequests: ImportRequest[];

  @OneToMany(() => BorrowRequest, (borrowRequest) => borrowRequest.createdBy)
  borrowRequests: BorrowRequest[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}

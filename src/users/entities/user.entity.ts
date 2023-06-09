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
import { ImportRequest } from '../../requests/entities/importRequest.entity';
import { BorrowRequest } from '../../requests/entities/borrowRequest.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column({name: 'first_name'})
  firstName: string;

  @Column({name: 'last_name'})
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({type: 'timestamptz', name: 'created_at'})
  createdAt: Date;

  @ManyToOne(() => Role, (role) => role.users)
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

import { Document } from '../../documents/entities/document.entity';
import { Department } from '../../departments/entities/department.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['name', 'department'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Department, (department) => department.categories)
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @OneToMany(() => Document, (document) => document.category)
  documents: Document[]
}

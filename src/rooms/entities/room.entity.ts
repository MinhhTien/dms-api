import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column({
    type: 'integer',
  })
  capacity: number;

  @ManyToOne(() => Department, (department) => department.rooms)
  @JoinColumn({ name: 'department_id' })
  department: Department;
}

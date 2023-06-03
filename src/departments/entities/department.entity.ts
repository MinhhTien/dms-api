import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @OneToMany(() => Room, (room) => room.department)
  rooms: Room[];
  
  @OneToMany(() => Category, (category) => category.department)
  categories: Category[];
}

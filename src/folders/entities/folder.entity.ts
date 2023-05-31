import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Locker } from '../../lockers/entities/locker.entity';

@Entity()
export class Folder {
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

  @ManyToOne(() => Locker, (locker) => locker.folders)
  @JoinColumn({ name: 'locker_id' })
  locker: Locker;
}

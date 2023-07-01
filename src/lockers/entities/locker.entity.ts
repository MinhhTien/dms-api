import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Folder } from '../../folders/entities/folder.entity';

@Entity()
@Index(['name', 'room'], { unique: true })
@Check('"capacity" > 0')
export class Locker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'integer',
    default: 10
  })
  capacity: number;

  @ManyToOne(() => Room, (room) => room.lockers)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @OneToMany(() => Folder, (folder) => folder.locker)
  folders: Folder[];
}

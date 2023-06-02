import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from '../../rooms/entities/room.entity';
import { Folder } from '../../folders/entities/folder.entity';

@Entity()
export class Locker {
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

  @ManyToOne(() => Room, (room) => room.lockers)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @OneToMany(() => Folder, (folder) => folder.locker)
  folders: Folder[];
}

import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Locker } from '../../lockers/entities/locker.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity()
@Check('"capacity" > 0')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column({
    type: 'integer',
    default: 1000
  })
  capacity: number;

  @ManyToOne(() => Locker, (locker) => locker.folders)
  @JoinColumn({ name: 'locker_id' })
  locker: Locker;

  @OneToMany(() => Document, (document) => document.folder)
  documents: Document[];
}

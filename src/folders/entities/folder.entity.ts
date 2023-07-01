import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Locker } from '../../lockers/entities/locker.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity()
@Index(['name', 'locker'], { unique: true })
@Check('"capacity" > 0')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
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

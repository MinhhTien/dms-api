import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
  })
  name: string;

  @Column({
    type: "text",
  })
  description: string;

  @ManyToOne(() => Folder, (folder) => folder.documents)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;
}

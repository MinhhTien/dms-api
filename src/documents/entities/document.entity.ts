import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';

@Entity()
@Check('"num_of_pages" > 0')
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

  @Column({
    type: "integer",
  })
  num_of_pages: number;

  @ManyToOne(() => Folder, (folder) => folder.documents)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;
}

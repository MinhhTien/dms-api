import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from '../../folders/entities/folder.entity';
import { DocumentStatus } from '../../constants/enum';
import { User } from '../../users/entities/user.entity';
import { ImportRequest } from '../../requests/entities/importRequest.entity';
import { BorrowRequest } from '../../requests/entities/borrowRequest.entity';

@Entity()
@Check('"num_of_pages" > 0')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    nullable: false
  })
  name: string;

  @Column({
    type: 'text',
  })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column()
  storage_url: string

  @Column({
    type: 'integer',
    default: 1
  })
  num_of_pages: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updated_by: User

  @ManyToOne(() => Folder, (folder) => folder.documents)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @OneToMany(() => ImportRequest, (importRequest) => importRequest.document)
  importRequests: ImportRequest[];

  @OneToMany(() => BorrowRequest, (borrowRequest) => borrowRequest.document)
  borrowRequests: BorrowRequest[];
}

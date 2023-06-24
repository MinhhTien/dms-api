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
import { ImportRequest } from '../../import_requests/entities/import_request.entity';
import { BorrowRequest } from '../../borrow_requests/entities/borrow_request.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity()
@Check('"num_of_pages" > 0')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    nullable: false,
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

  @Column({ name: 'storage_url', nullable: true, select: false })
  storageUrl: string;

  @Column({
    type: 'integer',
    default: 1,
    name: 'num_of_pages',
  })
  numOfPages: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => Folder, (folder) => folder.documents)
  @JoinColumn({ name: 'folder_id' })
  folder: Folder;

  @ManyToOne(() => Category, (category) => category.documents)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ImportRequest, (importRequest) => importRequest.document)
  importRequests: ImportRequest[];

  @OneToMany(() => BorrowRequest, (borrowRequest) => borrowRequest.document)
  borrowRequests: BorrowRequest[];
}

import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { BorrowRequest } from './borrow_request.entity';

@Entity()
export class BorrowHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.borrowHistories)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToOne(() => BorrowRequest)
  @JoinColumn({ name: 'borrow_request_id' })
  borrowRequest: BorrowRequest;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @ManyToOne(() => Document, (document) => document.borrowRequests, {
    cascade: ['update'],
  })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'return_date', type: 'timestamptz', nullable: true })
  returnDate: Date;

  @Column({ type: 'text', nullable: true })
  note: string;
}

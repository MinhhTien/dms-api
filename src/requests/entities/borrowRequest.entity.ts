import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { Request } from './request.entity';

@Entity()
@Check('"borrow_duration" > 0')
export class BorrowRequest extends Request {
  @Column({ nullable: true, name: 'start_date', type: 'timestamptz'})
  startDate: Date;

  @Column({ type: 'integer', default: 1, name: 'borrow_duration' })
  borrowDuration: number;

  @ManyToOne(() => Document, (document) => document.borrowRequests)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => User, (user) => user.borrowRequests)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}

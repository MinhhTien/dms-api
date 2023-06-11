import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { Request } from './request.entity';

@Entity()
export class ImportRequest extends Request {
  @ManyToOne(() => Document, (document) => document.importRequests)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => User, (user) => user.importRequests)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;
}

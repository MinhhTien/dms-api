import { DocumentStatus } from '../constants/enum';
import { AppDataSource } from '../database/data-source';
import { Document } from '../documents/entities/document.entity';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';

@singleton()
export class StatisticService {
  private documentRepository: Repository<Document>;

  constructor() {
    this.documentRepository = AppDataSource.getRepository(Document);
  }

  public async statisticByDepartment(status: DocumentStatus) {
    try {
      const result = await this.documentRepository
        .createQueryBuilder('document')
        .select('COUNT(*) as count, department.name as name')
        .innerJoin('document.folder', 'folder')
        .innerJoin('folder.locker', 'locker')
        .innerJoin('locker.room', 'room')
        .leftJoin('room.department', 'department')
        .where('document.status = :status', { status })
        .groupBy('department.name')
        .getRawMany();
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

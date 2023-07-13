import { UUID } from '../lib/global.type';
import { DocumentStatus } from '../constants/enum';
import { AppDataSource } from '../database/data-source';
import { Document } from '../documents/entities/document.entity';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { Folder } from '../folders/entities/folder.entity';

@singleton()
export class StatisticService {
  private documentRepository: Repository<Document>;
  private folderRepository: Repository<Folder>;

  constructor() {
    this.documentRepository = AppDataSource.getRepository(Document);
    this.folderRepository = AppDataSource.getRepository(Folder);
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

  public async documentSummary(departmentId?: UUID) {
    try {
      const numsOfAvailablePromise = this.documentRepository.countBy({
        status: DocumentStatus.AVAILABLE,
        ...(departmentId && { folder: {
          locker: {
            room: {
              department: { id: departmentId }
            }
          }
        }}),
      })
      const numsOfBorrowedPromise = this.documentRepository.countBy({
        status: DocumentStatus.BORROWED,
        ...(departmentId && { folder: {
          locker: {
            room: {
              department: { id: departmentId }
            }
          }
        }}),
      })
      const [numsOfAvailable, numsOfBorrowed] = await Promise.all([numsOfAvailablePromise, numsOfBorrowedPromise])
      return [{ status: DocumentStatus.AVAILABLE, count: numsOfAvailable }, { status: DocumentStatus.BORROWED, count: numsOfBorrowed}];
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async documentSpace(departmentId?: UUID) {
    try {
      const departmentCapacityPromise = departmentId ? this.folderRepository
        .createQueryBuilder('folder')
        .select('SUM(folder.capacity) as capacity, department.name as name')
        .innerJoin('folder.locker', 'locker')
        .innerJoin('locker.room', 'room')
        .leftJoin('room.department', 'department')
        .where('department.id = :departmentId', { departmentId })
        .groupBy('department.name')
        .orderBy('department.name')
        .getRawMany() 
        : 
        this.folderRepository
        .createQueryBuilder('folder')
        .select('SUM(folder.capacity) as capacity, department.name as name')
        .innerJoin('folder.locker', 'locker')
        .innerJoin('locker.room', 'room')
        .leftJoin('room.department', 'department')
        .groupBy('department.name')
        .orderBy('department.name')
        .getRawMany();
      
      const departmentUsedSpacePromise = departmentId ? this.documentRepository
      .createQueryBuilder('document')
      .select('SUM(document.numOfPages) as stored, department.name as name')
      .innerJoin('document.folder', 'folder')
      .innerJoin('folder.locker', 'locker')
      .innerJoin('locker.room', 'room')
      .leftJoin('room.department', 'department')
      .where('document.status IN (:...status)', { status: [DocumentStatus.AVAILABLE, DocumentStatus.BORROWED] })
      .andWhere('department.id = :departmentId', { departmentId })
      .groupBy('department.name')
      .orderBy('department.name')
      .getRawMany()
      : 
      this.documentRepository
        .createQueryBuilder('document')
        .select('SUM(document.numOfPages) as stored, department.name as name')
        .innerJoin('document.folder', 'folder')
        .innerJoin('folder.locker', 'locker')
        .innerJoin('locker.room', 'room')
        .leftJoin('room.department', 'department')
        .where('document.status IN (:...status)', { status: [DocumentStatus.AVAILABLE, DocumentStatus.BORROWED] })
        .groupBy('department.name')
        .orderBy('department.name')
        .getRawMany();
              
      const [departmentUsedSpace, departmentCapacity] = await Promise.all([departmentUsedSpacePromise, departmentCapacityPromise])

      return [{stored: departmentUsedSpace}, {capacity: departmentCapacity}];
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

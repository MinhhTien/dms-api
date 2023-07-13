import { UUID } from '../lib/global.type';
import { DocumentStatus, RequestStatus } from '../constants/enum';
import { AppDataSource } from '../database/data-source';
import { Document } from '../documents/entities/document.entity';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { Folder } from '../folders/entities/folder.entity';
import { ImportRequest } from '../import_requests/entities/import_request.entity';
import { BorrowRequest } from '../borrow_requests/entities/borrow_request.entity';

@singleton()
export class StatisticService {
  private documentRepository: Repository<Document>;
  private folderRepository: Repository<Folder>;
  private importRequestRepository: Repository<ImportRequest>;
  private borrowRequestRepository: Repository<BorrowRequest>;

  constructor() {
    this.documentRepository = AppDataSource.getRepository(Document);
    this.folderRepository = AppDataSource.getRepository(Folder);
    this.importRequestRepository = AppDataSource.getRepository(ImportRequest);
    this.borrowRequestRepository = AppDataSource.getRepository(BorrowRequest);
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

  public async importRequestReport(year: number, departmentId?: UUID) {
    try {
      const countApprovedImportRequestPromise = departmentId ? await this.importRequestRepository
        .createQueryBuilder('import_request')
        .select(`COUNT(*) as count, TO_CHAR(DATE(import_request.updatedAt), 'MM') as month`)
        .innerJoin('import_request.document', 'document')
        .innerJoin('document.folder', 'folder')
        .innerJoin('folder.locker', 'locker')
        .innerJoin('locker.room', 'room')
        .leftJoin('room.department', 'department')
        .where(`date_part('year', import_request.updatedAt) = :year`, { year })
        .andWhere('import_request.status = :status', { status: RequestStatus.DONE })
        .andWhere('department.id = :departmentId', { departmentId })
        .groupBy('month')
        .getRawMany()
          : 
        await this.importRequestRepository
        .createQueryBuilder('import_request')
        .select(`COUNT(*) as count, TO_CHAR(DATE(import_request.updatedAt), 'MM') as month`)
        .where(`date_part('year', import_request.updatedAt) = :year`, { year })
        .andWhere('import_request.status = :status', { status: RequestStatus.DONE })
        .groupBy('month')
        .getRawMany()

      const countRejectedImportRequestPromise = departmentId ? await this.importRequestRepository
      .createQueryBuilder('import_request')
      .select(`COUNT(*) as count, TO_CHAR(DATE(import_request.updatedAt), 'MM') as month`)
      .innerJoin('import_request.document', 'document')
      .innerJoin('document.folder', 'folder')
      .innerJoin('folder.locker', 'locker')
      .innerJoin('locker.room', 'room')
      .leftJoin('room.department', 'department')
      .where(`date_part('year', import_request.updatedAt) = :year`, { year })
      .andWhere('import_request.status = :status', { status: RequestStatus.REJECTED })
      .andWhere('department.id = :departmentId', { departmentId })
      .groupBy('month')
      .getRawMany() 
      : 
      await this.importRequestRepository
      .createQueryBuilder('import_request')
        .select(`COUNT(*) as count, TO_CHAR(DATE(import_request.updatedAt), 'MM') as month`)
        .where(`date_part('year', import_request.updatedAt) = :year`, { year })
        .andWhere('import_request.status = :status', { status: RequestStatus.REJECTED })
        .groupBy('month')
        .getRawMany();
      
      const [countApprovedImportRequest, countRejectedImportRequest] = await Promise.all([countApprovedImportRequestPromise, countRejectedImportRequestPromise])

      let countApproved = []
      let countRejected = []
      for (let i = 1; i <= 12; i++) {
        const foundApproved = countApprovedImportRequest.find((item) => Number(item.month) === i);
        const foundRejected = countRejectedImportRequest.find((item) => Number(item.month) === i);
        if (!foundApproved) {
          countApproved.push(0);
        } else {
          countApproved.push(Number(foundApproved.count));
        }
        if (!foundRejected) {
          countRejected.push(0);
        } else {
          countRejected.push(Number(foundRejected.count));
        }
      }

      return [{approved: countApproved}, {reject: countRejected}];
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async borrowRequestReport(year: number, departmentId?: UUID) {
    try {
      const countApprovedBorrowRequestPromise = departmentId ? await this.borrowRequestRepository
        .createQueryBuilder('borrow_request')
        .select(`COUNT(*) as count, TO_CHAR(DATE(borrow_request.updatedAt), 'MM') as month`)
        .innerJoin('borrow_request.document', 'document')
        .innerJoin('document.folder', 'folder')
        .innerJoin('folder.locker', 'locker')
        .innerJoin('locker.room', 'room')
        .leftJoin('room.department', 'department')
        .where(`date_part('year', borrow_request.updatedAt) = :year`, { year })
        .andWhere('borrow_request.status = :status', { status: RequestStatus.DONE })
        .andWhere('department.id = :departmentId', { departmentId })
        .groupBy('month')
        .getRawMany()
          : 
        await this.borrowRequestRepository
        .createQueryBuilder('borrow_request')
        .select(`COUNT(*) as count, TO_CHAR(DATE(borrow_request.updatedAt), 'MM') as month`)
        .where(`date_part('year', borrow_request.updatedAt) = :year`, { year })
        .andWhere('borrow_request.status = :status', { status: RequestStatus.DONE })
        .groupBy('month')
        .getRawMany()

      const countRejectedBorrowRequestPromise = departmentId ? await this.borrowRequestRepository
      .createQueryBuilder('borrow_request')
      .select(`COUNT(*) as count, TO_CHAR(DATE(borrow_request.updatedAt), 'MM') as month`)
      .innerJoin('borrow_request.document', 'document')
      .innerJoin('document.folder', 'folder')
      .innerJoin('folder.locker', 'locker')
      .innerJoin('locker.room', 'room')
      .leftJoin('room.department', 'department')
      .where(`date_part('year', borrow_request.updatedAt) = :year`, { year })
      .andWhere('borrow_request.status = :status', { status: RequestStatus.REJECTED })
      .andWhere('department.id = :departmentId', { departmentId })
      .groupBy('month')
      .getRawMany() 
      : 
      await this.borrowRequestRepository
      .createQueryBuilder('borrow_request')
        .select(`COUNT(*) as count, TO_CHAR(DATE(borrow_request.updatedAt), 'MM') as month`)
        .where(`date_part('year', borrow_request.updatedAt) = :year`, { year })
        .andWhere('borrow_request.status = :status', { status: RequestStatus.REJECTED })
        .groupBy('month')
        .getRawMany();
      
      const [countApprovedBorrowRequest, countRejectedBorrowRequest] = await Promise.all([countApprovedBorrowRequestPromise, countRejectedBorrowRequestPromise])
     
      let countApproved = []
      let countRejected = []
      for (let i = 1; i <= 12; i++) {
        const foundApproved = countApprovedBorrowRequest.find((item) => Number(item.month) === i);
        const foundRejected = countRejectedBorrowRequest.find((item) => Number(item.month) === i);
        if (!foundApproved) {
          countApproved.push(0);
        } else {
          countApproved.push(Number(foundApproved.count));
        }
        if (!foundRejected) {
          countRejected.push(0);
        } else {
          countRejected.push(Number(foundRejected.count));
        }
      }

      return [{approved: countApproved}, {reject: countRejected}];
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

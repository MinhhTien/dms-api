import { AppDataSource } from '../database/data-source';
import { singleton } from 'tsyringe';
import { EntityNotFoundError, LessThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ImportRequest } from './entities/import_request.entity';
import { CreateImportRequestDto } from './dtos/create_import_request.dto';
import { Document } from '../documents/entities/document.entity';
import { DocumentStatus, RequestStatus } from '../constants/enum';
import { UUID } from 'lib/global.type';
import { RejectImportRequestDto } from './dtos/reject_import_request.dto';
import { Folder } from '../folders/entities/folder.entity';
import { FindImportRequestDto } from './dtos/find_import_request.dto';
import { uuidToBase64 } from '../lib/barcode';
import { subtractDays } from '../lib/utils';

@singleton()
export class ImportRequestService {
  private importRequestRepository: Repository<ImportRequest>;
  private documentRepository: Repository<Document>;
  private folderRepository: Repository<Folder>;

  constructor() {
    this.importRequestRepository = AppDataSource.getRepository(ImportRequest);
    this.documentRepository = AppDataSource.getRepository(Document);
    this.folderRepository = AppDataSource.getRepository(Folder);
  }

  public async getOne(id: UUID, createdBy?: UUID) {
    try {
      const result = await this.importRequestRepository.findOne({
        where: {
          id: id,
          ...(createdBy && { createdBy: { id: createdBy } }),
        },
        relations: {
          document: {
            folder: {
              locker: {
                room: {
                  department: true,
                },
              },
            },
            category: true,
            createdBy: true,
            updatedBy: true,
          },
          createdBy: true,
          updatedBy: true,
        },
      });
      return result?.status === RequestStatus.APPROVED && createdBy
        ? {
            ...result,
            qrcode: uuidToBase64(result.id),
          }
        : result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async getMany(dto: FindImportRequestDto, createdBy?: UUID) {
    const take = dto.take || 10;
    const page = dto.page || 1;
    const skip = (page - 1) * take;
    try {
      const [result, total] = await this.importRequestRepository.findAndCount({
        where: {
          ...(createdBy && { createdBy: { id: createdBy } }),
          ...(dto.status && { status: dto.status }),
        },
        relations: {
          document: {
            folder: {
              locker: {
                room: {
                  department: true,
                },
              },
            },
            category: true,
            createdBy: true,
            updatedBy: true,
          },
          createdBy: true,
          updatedBy: true,
        },
        order: {
          updatedAt: 'DESC',
          createdAt: 'DESC',
        },
        take: take,
        skip: skip,
      });
      return {
        data: createdBy
          ? result.map((importRequest: ImportRequest) => {
              return {
                ...importRequest,
                ...(importRequest.status === RequestStatus.APPROVED && {
                  qrcode: uuidToBase64(importRequest.id),
                }),
              };
            })
          : result,
        total: total,
      };
    } catch (error) {
      console.log(error);
      return { data: [], total: 0 };
    }
  }

  public async create(
    createImportRequestDto: CreateImportRequestDto,
    createdBy: User
  ) {
    try {
      // Check validate metadata
      const folder = await this.folderRepository.findOneOrFail({
        where: {
          id: createImportRequestDto.document.folder.id, //createdBy.department.id,
          locker: {
            room: {
              department: {
                id: createdBy.department.id,
                categories: {
                  id: createImportRequestDto.document.category.id,
                },
              },
            },
          },
        },
        relations: ['documents'],
      });

      // check if folder has enough capacity
      if (folder) {
        if (
          folder.documents
            .filter((document) =>
              [
                DocumentStatus.AVAILABLE,
                DocumentStatus.BORROWED,
                DocumentStatus.PENDING,
              ].includes(document.status)
            )
            .reduce((sum, document) => sum + document.numOfPages, 0) +
            createImportRequestDto.document.numOfPages >
          folder.capacity
        ) {
          return 'Not have enough space in Folder.';
        }
      } else {
        return 'Folder not existed.';
      }

      const document = await this.documentRepository.create(
        createImportRequestDto.document
      );
      document.createdBy = createdBy;
      document.status = DocumentStatus.REQUESTING;
      const importRequest = this.importRequestRepository.create(
        createImportRequestDto
      );
      importRequest.createdBy = createdBy;
      importRequest.document = document;
      const result = await this.importRequestRepository.save(importRequest);
      console.log(result);
      return result;
    } catch (error: any) {
      console.log('====');
      console.error(error);
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error instanceof EntityNotFoundError)
        return 'Wrong metadata of document';
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Document name is already existed.';
      }
      return null;
    }
  }

  public async accept(id: UUID, updatedBy: User) {
    try {
      const importRequest = await this.importRequestRepository.findOne({
        where: {
          id: id,
          status: RequestStatus.PENDING,
          document: {
            status: DocumentStatus.REQUESTING,
          },
        },
        relations: {
          document: true,
          createdBy: true,
          updatedBy: true,
        },
      });

      if (!importRequest) {
        return 'Import Request not existed';
      }

      importRequest.status = RequestStatus.APPROVED;
      importRequest.updatedBy = updatedBy;
      const result = await this.importRequestRepository.save(importRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async verify(id: UUID, updatedBy: User) {
    try {
      const importRequest = await this.importRequestRepository.findOne({
        where: {
          id: id,
          status: RequestStatus.APPROVED,
          document: {
            status: DocumentStatus.REQUESTING,
          },
        },
        relations: {
          document: true,
        },
      });

      if (!importRequest) {
        return 'Import Request not existed';
      }

      importRequest.status = RequestStatus.DONE;
      importRequest.updatedBy = updatedBy;
      importRequest.document.status = DocumentStatus.PENDING;
      const result = await this.importRequestRepository.save(importRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async reject(
    rejectImportRequestDto: RejectImportRequestDto,
    updatedBy: User
  ) {
    try {
      const importRequest = await this.importRequestRepository.findOne({
        where: {
          id: rejectImportRequestDto.id,
          status: RequestStatus.PENDING,
          document: {
            status: DocumentStatus.REQUESTING,
          },
        },
        relations: {
          createdBy: true,
          updatedBy: true,
        }
      });

      if (!importRequest) {
        return 'Import Request not existed';
      }

      importRequest.rejectedReason = rejectImportRequestDto.rejectedReason;
      importRequest.status = RequestStatus.REJECTED;
      importRequest.updatedBy = updatedBy;
      const result = await this.importRequestRepository.save(importRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async cancel(id: UUID, updatedBy: User) {
    try {
      const importRequest = await this.importRequestRepository.findOne({
        where: {
          id: id,
          status: RequestStatus.PENDING,
          document: {
            status: DocumentStatus.REQUESTING,
          },
        },
      });
      if (!importRequest) {
        return 'Import Request not existed';
      }

      importRequest.status = RequestStatus.CANCELED;
      importRequest.updatedBy = updatedBy;
      const result = await this.importRequestRepository.save(importRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async updateExpired() {
    try {
      const updateExpiredPending = this.importRequestRepository.update(
        {
          status: RequestStatus.PENDING,
          expired_at: LessThan(new Date()),
        },
        {
          status: RequestStatus.EXPIRED,
        }
      );
      const updateExpiredApproved = this.importRequestRepository.update(
        {
          status: RequestStatus.APPROVED,
          updatedAt: LessThan(subtractDays(new Date(), 3)),
        },
        {
          status: RequestStatus.EXPIRED,
        }
      );
      return Promise.all([updateExpiredPending, updateExpiredApproved]);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

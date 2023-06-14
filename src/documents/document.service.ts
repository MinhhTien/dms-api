import { AppDataSource } from '../database/data-source';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { User } from '../users/entities/user.entity';
import { Folder } from '../folders/entities/folder.entity';
import { UUID } from '../lib/global.type';
import { DocumentStatus } from '../constants/enum';
import { Category } from '../categories/entities/category.entity';

@singleton()
export class DocumentService {
  private documentRepository: Repository<Document>;

  constructor() {
    this.documentRepository = AppDataSource.getRepository(Document);
  }

  public async getOne(id: UUID, departmentId?: UUID) {
    try {
      return departmentId
        ? await this.documentRepository.findOne({
            where: {
              id: id,
              folder: {
                locker: {
                  room: {
                    department: {
                      id: departmentId,
                    },
                  },
                },
              },
            },
          })
        : await this.documentRepository.findOne({
            where: {
              id: id,
            },
          });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async getMany(folderId: UUID, departmentId?: UUID) {
    try {
      return departmentId
        ? await this.documentRepository.find({
            where: {
              folder: {
                id: folderId,
                locker: {
                  room: {
                    department: {
                      id: departmentId,
                    },
                  },
                },
              },
            },
          })
        : await this.documentRepository.find({
            where: {
              folder: {
                id: folderId,
              },
            },
          });
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async create(createDocumentDto: CreateDocumentDto, createdBy: User) {
    try {
      // check if department contains category
      const category = await AppDataSource.getRepository(Category).findOne({
        where: {
          id: createDocumentDto.category.id,
          department: {
            rooms: {
              lockers: {
                folders: {
                  id: createDocumentDto.folder.id,
                },
              },
            },
          },
        },
      });
      if (!category) {
        return 'Category is not existed in this location.';
      }
      // check if folder has enough capacity
      const folder = await AppDataSource.getRepository(Folder).findOne({
        where: {
          id: createDocumentDto.folder.id,
        },
        relations: ['documents'],
      });
      if (folder) {
        if (
          folder.documents.reduce(
            (sum, document) => sum + document.numOfPages,
            0
          ) +
            createDocumentDto.numOfPages >
          folder.capacity
        ) {
          return 'Not have enough space in Folder.';
        }
      } else {
        return 'Folder not existed.';
      }
      const document = this.documentRepository.create(createDocumentDto);
      document.createdBy = createdBy;
      const result = await this.documentRepository.save(document);
      console.log(result.id);
      return result;
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Document name is already existed.';
      }
      return null;
    }
  }

  public async update(documentId: UUID, fileName: string, updatedBy: User) {
    try {
      const result = await this.documentRepository.update(
        {
          id: documentId,
        },
        {
          storageUrl: fileName,
          updatedBy: updatedBy,
        }
      );
      return result.affected === 1;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async confirm(documentId: UUID, folderId: UUID, updatedBy: User) {
    try {
      const result = await this.documentRepository.update(
        {
          id: documentId,
          status: DocumentStatus.PENDING,
          folder: {
            id: folderId,
          },
        },
        {
          status: DocumentStatus.AVAILABLE,
          updatedBy: updatedBy,
        }
      );
      return result.affected === 1;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
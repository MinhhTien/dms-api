import { Folder } from './entities/folder.entity';
import { AppDataSource } from '../database/data-source';
import { UpdateFolderDto, CreateFolderDto } from './dtos/folder.dto';
import { UUID } from '../lib/global.type';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { Locker } from '../lockers/entities/locker.entity';

@singleton()
export class FolderService {
  private folderRepository: Repository<Folder>;

  constructor() {
    this.folderRepository = AppDataSource.getRepository(Folder);
  }

  public async getOne(id: UUID, departmentId?: UUID) {
    try {
      return departmentId
        ? await this.folderRepository.findOne({
            where: {
              id: id,
              locker: {
                room: {
                  department: {
                    id: departmentId,
                  },
                },
              },
            },
          })
        : await this.folderRepository.findOne({
            where: {
              id: id,
            },
          });
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  public async getMany(lockerId: UUID, departmentId: UUID) {
    try {
      return departmentId
        ? await this.folderRepository.find({
            where: {
              locker: {
                id: lockerId,
                room: {
                  department: {
                    id: departmentId,
                  },
                },
              },
            },
          })
        : await this.folderRepository.find({
            where: {
              locker: {
                id: lockerId,
              },
            },
          });
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async create(folderDto: CreateFolderDto) {
    try {
      // check if locker has enough capacity
      const locker = await AppDataSource.getRepository(Locker).findOne({
        where: {
          id: folderDto.locker.id,
        },
        relations: ['folders'],
      });
      if (locker) {
        if (locker.folders.length >= locker.capacity) {
          return 'Locker is full.';
        }
      } else {
        return 'Locker is not existed.';
      }

      const folder = this.folderRepository.create(folderDto);
      return await this.folderRepository.save(folder);
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Folder name is already existed.';
      }
      return null;
    }
  }

  public async update(folder: UpdateFolderDto) {
    try {
      //check if folder is existed and capacity is not smaller than current number of documents
      const currentFolder = await this.folderRepository.findOne({
        where: {
          id: folder.id,
        },
        relations: ['documents'],
      });
      if (currentFolder) {
        const currentNumOfPages = currentFolder.documents.reduce(
          (sum, document) => sum + document.numOfPages,
          0
        );
        if (folder.capacity < currentNumOfPages) {
          return 'Capacity must greater or equal to all current pages of documents.';
        }
      }
      const result = await this.folderRepository.update(
        {
          id: folder.id,
        },
        folder
      );
      return result.affected === 1;
    } catch (error: any) {
      console.log(error);
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Folder name is already existed.';
      }
      return false;
    }
  }

  public async delete(id: string) {
    const result = await this.folderRepository.delete({
      id: id,
    });
    return result.affected === 1;
  }
}

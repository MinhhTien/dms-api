import { Department } from './entities/department.entity';
import { AppDataSource } from '../database/data-source';
import {
  UpdateDepartmentDto,
  CreateDepartmentDto,
} from './dtos/department.dto';
import { UUID } from 'lib/global.type';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { DocumentStatus } from '../constants/enum';

@singleton()
export class DepartmentService {
  private departmentRepository: Repository<Department>;

  constructor() {
    this.departmentRepository = AppDataSource.getRepository(Department);
  }

  public async getOne(id: UUID) {
    try {
      return await this.departmentRepository.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async getAll() {
    return await this.departmentRepository.find({order: { name: 'ASC' }});
  }

  public async count() {
    return await this.departmentRepository.count();
  }

  public async getTree(departmentId?: UUID) {
    try {
      let tree = await this.departmentRepository.find({
        where: {
          ...(departmentId && { id: departmentId }),
        },
        relations: {
          rooms: {
            lockers: {
              folders: {
                documents: true,
              },
            },
          },
        },
        order: {
          name: 'ASC',
          rooms: {
            name: 'ASC',
            lockers: {
              name: 'ASC',
              folders: {
                name: 'ASC',
                documents: {
                  name: 'ASC',
                }
              },
            }
          },
        }
      });
      tree.forEach((department) => {
        return department.rooms.forEach((room) => {
          return room.lockers.forEach((locker) => {
            return locker.folders.forEach((folder) => {
              folder.documents = folder.documents.filter((document) =>
                [DocumentStatus.AVAILABLE, DocumentStatus.BORROWED].includes(
                  document.status
                )
              );
            });
          });
        });
      });
      return tree;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async create(departmentDto: CreateDepartmentDto) {
    try {
      const department = this.departmentRepository.create(departmentDto);
      return await this.departmentRepository.save(department);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async update(department: UpdateDepartmentDto) {
    try {
      const result = await this.departmentRepository.update(
        {
          id: department.id,
        },
        department
      );
      return result.affected === 1;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async delete(id: string) {
    try {
      const result = await AppDataSource.getRepository(Department).delete({
        id: id,
      });
      return result.affected === 1;
    } catch (error: any) {
      console.log('====');
      console.error(error?.code);
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('still referenced')) {
        return 'Department already contains Rooms';
      }
      return false;
    }
  }
}

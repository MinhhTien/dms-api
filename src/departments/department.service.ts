import { Department } from './entities/department.entity';
import { AppDataSource } from '../database/data-source';
import { DepartmentDto, CreateDepartmentDto } from './dtos/department.dto';
import { UUID } from 'type/global';

export class DepartmentService {
  public async getOne(id: UUID) {
    return await AppDataSource.getRepository(Department).findOne({
      where: {
        id: id
      },
    });
  }
  public async getAll() {
    return await AppDataSource.getRepository(Department).find();
  }

  public async create(department: CreateDepartmentDto) {
    return await AppDataSource.getRepository(Department).save(department);
  }

  public async update(department: DepartmentDto) {
    const result = await AppDataSource.getRepository(Department).update({
        id: department.id
    }, department)
    return result.affected === 1;
  }

  public async delete(id: string) {
    const result = await AppDataSource.getRepository(Department).delete({
      id: id
    });
    return result.affected === 1;
  }
}

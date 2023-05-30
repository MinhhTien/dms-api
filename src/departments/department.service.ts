import { Department } from './entities/department.entity';
import { AppDataSource } from '../database/data-source';
import {
  UpdateDepartmentDto,
  CreateDepartmentDto,
} from './dtos/department.dto';
import { UUID } from 'type/global';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';

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
    return await this.departmentRepository.find();
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
    const result = await AppDataSource.getRepository(Department).delete({
      id: id,
    });
    return result.affected === 1;
  }
}
